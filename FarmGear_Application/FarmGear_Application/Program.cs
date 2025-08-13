using System.Text;
using FarmGear_Application.Configuration;
using FarmGear_Application.Data;
using FarmGear_Application.Models;
using FarmGear_Application.Services;
using FarmGear_Application.DTOs;
using FarmGear_Application.Validators;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FluentValidation;
using FluentValidation.AspNetCore;
using FarmGear_Application.Interfaces.PaymentGateways;
using FarmGear_Application.Services.PaymentGateways;
using StackExchange.Redis;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 🔧 Unified configuration registration
builder.Services.AddApplicationConfigurations(builder.Configuration);

// Configure logging to reduce console output
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Add database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

// 🔧 Configure Redis connection using unified configuration
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var redisSettings = sp.GetRequiredService<IOptions<RedisSettings>>().Value;
    var configuration = ConfigurationOptions.Parse(redisSettings.ConnectionString);
    configuration.DefaultDatabase = redisSettings.DatabaseId;
    return ConnectionMultiplexer.Connect(configuration);
});

// Configure Identity
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    // Password policy
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    options.Password.RequiredUniqueChars = 1;

    // User policy
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 🔧 JWT authentication configuration registered through extension method

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer();

// Register authorization services
builder.Services.AddAuthorization();

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<FarmGear_Application.Interfaces.Common.IEmailSender, EmailSender>();
builder.Services.AddScoped<RoleSeedService>();
builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();
builder.Services.AddScoped<EnhancedJwtService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IFileService, FileService>();

// 🤖 Order expiration handling service
builder.Services.AddScoped<IOrderExpirationService, OrderExpirationService>();
builder.Services.AddHostedService<OrderExpirationService>();

// 🔧 Alipay configuration registered through extension method
builder.Services.AddScoped<IAlipayService, AlipayService>();

// 🏥 Add environment-aware health check services
builder.Services.AddEnvironmentAwareHealthChecks(builder.Configuration, builder.Environment);

// Register controller services
builder.Services.AddControllers();

// Register validators
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FarmGear API",
        Version = "v1",
        Description = "FarmGear Equipment Rental Platform API - Uses HttpOnly Cookie Authentication"
    });

    // Add XML documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);

    // 🔧 Remove Bearer Token configuration because now using HttpOnly Cookie authentication
    // HttpOnly Cookie is automatically handled by browser, no need for manual configuration in Swagger
});

// Add CORS - Support HttpOnly Cookie
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                  "http://localhost:3000",    // React default port
                  "http://localhost:8080",    // Vue default port  
                  "http://localhost:4200",    // Angular default port
                  "http://localhost:5173",    // Vite default port
                  "http://localhost:8000",    // Other common ports
                  "https://localhost:3000",   // HTTPS version
                  "https://localhost:8080",
                  "https://localhost:4200",
                  "https://localhost:5173",
                  "https://localhost:8000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // 🔥 Important: Support HttpOnly Cookie
    });
});

builder.Services.AddTransient<IConfigureOptions<JwtBearerOptions>, JwtBearerOptionsSetup>();

// Global rate limiting (default applied to all requests)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: "global",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromSeconds(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        )
    );
});

var app = builder.Build();

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global exception handling (simple Problem response)
app.UseExceptionHandler(builder =>
{
    builder.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        var responseJson = System.Text.Json.JsonSerializer.Serialize(new { Success = false, Message = "Internal server error" });
        await context.Response.WriteAsync(responseJson);
    });
});

if (app.Environment.IsProduction())
{
    app.UseHsts();
}

// Reverse proxy/container original protocol and IP
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
});

// Basic security response headers
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseHttpsRedirection();
app.UseCors();

// Configure static file service
app.UseStaticFiles();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 🏥 Configure environment-aware health check endpoints
app.MapEnvironmentAwareHealthCheckEndpoints(builder.Configuration, builder.Environment);

// Automatically apply database migrations and initialize roles
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        if (context.Database.ProviderName != null && context.Database.ProviderName.Contains("InMemory"))
        {
            context.Database.EnsureCreated();
        }
        else
        {
            context.Database.Migrate();
        }

        // Initialize roles
        var roleSeedService = services.GetRequiredService<RoleSeedService>();
        await roleSeedService.SeedRolesAsync();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database or seeding roles.");
    }
}

app.Run();

public partial class Program { }

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
