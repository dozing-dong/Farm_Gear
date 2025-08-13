using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Security.Claims;
using FarmGear_Application;
using FarmGear_Application.DTOs.Location;
using FarmGear_Application.DTOs;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Interfaces.Common;
using FarmGear_Application.Configuration;
using FarmGear_Application.Constants;
using FarmGear_Application.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity;
using FarmGear_Application.Data;
using Xunit;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

namespace FarmGear_Application.Tests.Integration;

/// <summary>
/// 位置控制器的集成测试类
/// 用于测试位置管理API的端到端功能，包括：
/// - 位置的查询和更新操作
/// - 身份认证和授权
/// - API响应状态
/// - 数据验证
/// </summary>
public class LocationControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
  /// <summary>
  /// Web应用程序工厂实例，用于创建测试服务器
  /// </summary>
  private readonly WebApplicationFactory<Program> _factory;

  /// <summary>
  /// HTTP客户端实例，用于发送测试请求
  /// </summary>
  private readonly HttpClient _client;

  /// <summary>
  /// 测试用户ID
  /// </summary>
  private string _testUserId = string.Empty;

  /// <summary>
  /// 测试用户Token
  /// </summary>
  private string _testUserToken = string.Empty;

  /// <summary>
  /// 构造函数，初始化测试环境
  /// </summary>
  /// <param name="factory">Web应用程序工厂实例</param>
  public LocationControllerIntegrationTests(WebApplicationFactory<Program> factory)
  {
    _factory = factory.WithWebHostBuilder(builder =>
    {
      // 配置测试环境
      builder.UseEnvironment("Testing");

      // 配置测试服务
      builder.ConfigureServices(services =>
      {
        // 移除原有的数据库上下文
        var descriptor = services.SingleOrDefault(
            d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
        if (descriptor != null)
        {
          services.Remove(descriptor);
        }

        // 根据配置选择数据库类型
        var configuration = services.BuildServiceProvider().GetRequiredService<IConfiguration>();
        var useDocker = configuration.GetValue<bool>("TestEnvironment:UseDocker", false);
        var useInMemory = configuration.GetValue<bool>("TestEnvironment:UseInMemoryDatabase", true);

        if (useDocker && !useInMemory)
        {
          // 使用Docker中的MySQL数据库
          services.AddDbContext<ApplicationDbContext>(options =>
          {
            options.UseMySql(
                configuration.GetConnectionString("DockerConnection"),
                ServerVersion.AutoDetect(configuration.GetConnectionString("DockerConnection"))
            );
          });
        }
        else
        {
          // 使用内存数据库（默认）
          services.AddDbContext<ApplicationDbContext>(options =>
          {
            options.UseInMemoryDatabase("FarmGearLocationTestDb");
          });
        }

        // 配置测试用的JWT设置
        var testJwtSecret = "test-secret-key-that-is-long-enough-for-testing-purposes-only";
        services.Configure<JwtSettings>(options =>
        {
          options.SecretKey = testJwtSecret;
          options.Issuer = "test-issuer";
          options.Audience = "test-audience";
          options.ExpiryInMinutes = 60;
        });

        // 重新配置JWT认证选项
        services.PostConfigure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme, options =>
        {
          options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
          {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(testJwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = "test-issuer",
            ValidateAudience = true,
            ValidAudience = "test-audience",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
          };
        });

        // 移除Redis服务，使用内存缓存替代
        var redisDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IRedisCacheService));
        if (redisDescriptor != null)
        {
          services.Remove(redisDescriptor);
        }
        services.AddSingleton<IRedisCacheService, FarmGear_Application.Tests.MockRedisCacheService>();

        // 移除EmailSender服务，使用模拟实现
        var emailDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(FarmGear_Application.Interfaces.Common.IEmailSender));
        if (emailDescriptor != null)
        {
          services.Remove(emailDescriptor);
        }
        services.AddScoped<FarmGear_Application.Interfaces.Common.IEmailSender, FarmGear_Application.Services.EmailSender>();
      });
    });

    // 创建测试客户端
    _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
      AllowAutoRedirect = false
    });

    // 初始化测试数据
    InitializeTestDataAsync().Wait();
  }

  /// <summary>
  /// 初始化测试数据
  /// </summary>
  private async Task InitializeTestDataAsync()
  {
    using var scope = _factory.Services.CreateScope();
    var services = scope.ServiceProvider;

    // 初始化数据库
    await InitializeTestDatabaseAsync(services);

    // 创建测试用户
    _testUserToken = await CreateTestUserAndGetTokenAsync(services, "locationtestuser", "locationtest@example.com", "Test123!@#", UserRoles.Provider);

    // 从Token中提取用户ID（简化处理）
    _testUserId = "locationtestuser";
  }

  /// <summary>
  /// 初始化测试数据库
  /// </summary>
  /// <param name="services">服务提供者</param>
  private async Task InitializeTestDatabaseAsync(IServiceProvider services)
  {
    var context = services.GetRequiredService<ApplicationDbContext>();
    var roleSeedService = services.GetRequiredService<RoleSeedService>();

    // 确保数据库已创建（内存数据库会自动创建）
    await context.Database.EnsureCreatedAsync();

    // 初始化角色
    await roleSeedService.SeedRolesAsync();
  }

  /// <summary>
  /// 创建测试用户并返回认证Token
  /// </summary>
  /// <param name="services">服务提供者</param>
  /// <param name="username">用户名</param>
  /// <param name="email">邮箱</param>
  /// <param name="password">密码</param>
  /// <param name="role">角色</param>
  /// <returns>认证Token</returns>
  private async Task<string> CreateTestUserAndGetTokenAsync(
      IServiceProvider services,
      string username = "locationtestuser",
      string email = "locationtest@example.com",
      string password = "Test123!@#",
      string role = UserRoles.Provider)
  {
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    var jwtService = services.GetRequiredService<EnhancedJwtService>();

    // 确保角色存在
    if (!await roleManager.RoleExistsAsync(role))
    {
      await roleManager.CreateAsync(new IdentityRole(role));
    }

    // 检查用户是否已存在
    var existingUser = await userManager.FindByEmailAsync(email);
    if (existingUser == null)
    {
      // 创建新用户
      var user = new AppUser
      {
        UserName = username,
        Email = email,
        EmailConfirmed = true,
        Lat = 39.9042m,
        Lng = 116.4074m
      };

      var createResult = await userManager.CreateAsync(user, password);
      if (!createResult.Succeeded)
      {
        throw new Exception($"Failed to create test user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
      }

      // 添加角色
      await userManager.AddToRoleAsync(user, role);
      existingUser = user;
    }

    // 生成JWT Token
    var token = await jwtService.GenerateTokenWithSessionAsync(existingUser);

    return token;
  }

  #region GetNearbyEquipment Tests

  /// <summary>
  /// 测试获取附近设备 - 返回成功和正确格式
  /// </summary>
  [Fact]
  public async Task GetNearbyEquipment_ReturnsSuccessAndCorrectFormat()
  {
    // Arrange
    var queryString = "?latitude=39.9042&longitude=116.4074&radius=5000&pageNumber=1&pageSize=10";

    // Act
    var response = await _client.GetAsync($"/api/Location/nearby-equipment{queryString}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var result = JsonSerializer.Deserialize<ApiResponse<PaginatedList<EquipmentLocationDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    result.Should().NotBeNull();
    result!.Success.Should().BeTrue();
    result.Data.Should().NotBeNull();
    result.Data!.Items.Should().NotBeNull();
  }

  /// <summary>
  /// 测试获取附近设备 - 无效坐标返回错误
  /// </summary>
  [Fact]
  public async Task GetNearbyEquipment_InvalidCoordinates_ReturnsBadRequest()
  {
    // Arrange
    var queryString = "?latitude=200&longitude=300&radius=5000&pageNumber=1&pageSize=10";

    // Act
    var response = await _client.GetAsync($"/api/Location/nearby-equipment{queryString}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
  }

  #endregion

  #region GetHeatmapData Tests

  /// <summary>
  /// 测试获取热力图数据 - 返回成功和正确格式
  /// </summary>
  [Fact]
  public async Task GetHeatmapData_ReturnsSuccessAndCorrectFormat()
  {
    // Arrange
    var queryString = "?southWestLat=39.9&southWestLng=116.4&northEastLat=40.0&northEastLng=116.5";

    // Act
    var response = await _client.GetAsync($"/api/Location/equipment-heatmap{queryString}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var result = JsonSerializer.Deserialize<ApiResponse<List<HeatmapPoint>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    result.Should().NotBeNull();
    result!.Success.Should().BeTrue();
    result.Data.Should().NotBeNull();
  }

  /// <summary>
  /// 测试获取热力图数据 - 无效边界返回错误
  /// </summary>
  [Fact]
  public async Task GetHeatmapData_InvalidBounds_ReturnsBadRequest()
  {
    // Arrange - 边界颠倒
    var queryString = "?southWestLat=40.0&southWestLng=116.5&northEastLat=39.9&northEastLng=116.4";

    // Act
    var response = await _client.GetAsync($"/api/Location/equipment-heatmap{queryString}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
  }

  #endregion

  #region UpdateMyLocation Tests

  /// <summary>
  /// 测试更新我的位置 - 无身份验证返回未授权
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Arrange
    var request = CreateTestUpdateLocationRequest();

    // Act
    var response = await _client.PutAsJsonAsync("/api/Location/my-location", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试更新我的位置 - 有身份验证返回成功
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testUserToken);
    var request = CreateTestUpdateLocationRequest();

    // Act
    var response = await _client.PutAsJsonAsync("/api/Location/my-location", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var result = JsonSerializer.Deserialize<ApiResponse<LocationViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    result.Should().NotBeNull();
    result!.Success.Should().BeTrue();
    result.Data.Should().NotBeNull();
    result.Data!.Latitude.Should().Be(request.Latitude);
    result.Data.Longitude.Should().Be(request.Longitude);
  }

  /// <summary>
  /// 测试更新我的位置 - 无效坐标返回错误
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_InvalidCoordinates_ReturnsBadRequest()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testUserToken);
    var request = new UpdateLocationRequest
    {
      Latitude = 200, // 无效纬度
      Longitude = 300  // 无效经度
    };

    // Act
    var response = await _client.PutAsJsonAsync("/api/Location/my-location", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
  }

  #endregion

  #region GetMyLocation Tests

  /// <summary>
  /// 测试获取我的位置 - 无身份验证返回未授权
  /// </summary>
  [Fact]
  public async Task GetMyLocation_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.GetAsync("/api/Location/my-location");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试获取我的位置 - 有身份验证返回成功
  /// </summary>
  [Fact]
  public async Task GetMyLocation_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testUserToken);

    // 先更新位置，确保有数据
    var updateRequest = CreateTestUpdateLocationRequest();
    await _client.PutAsJsonAsync("/api/Location/my-location", updateRequest);

    // Act
    var response = await _client.GetAsync("/api/Location/my-location");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var result = JsonSerializer.Deserialize<ApiResponse<LocationViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    result.Should().NotBeNull();
    result!.Success.Should().BeTrue();
    result.Data.Should().NotBeNull();
    result.Data!.UserId.Should().NotBeNullOrEmpty();
  }

  #endregion

  #region Provider Location Tests

  /// <summary>
  /// 测试获取供应商位置 - 返回成功和正确格式
  /// </summary>
  [Fact]
  public async Task GetProviderLocations_ReturnsSuccessAndCorrectFormat()
  {
    // Arrange
    var queryString = "?latitude=39.9042&longitude=116.4074&radius=10000&pageNumber=1&pageSize=10";

    // Act
    var response = await _client.GetAsync($"/api/Location/provider-distribution{queryString}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var result = JsonSerializer.Deserialize<ApiResponse<PaginatedList<ProviderLocationDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    result.Should().NotBeNull();
    result!.Success.Should().BeTrue();
    result.Data.Should().NotBeNull();
    result.Data!.Items.Should().NotBeNull();
  }

  #endregion

  #region Helper Methods

  /// <summary>
  /// 创建测试用的更新位置请求
  /// </summary>
  /// <param name="latitude">纬度</param>
  /// <param name="longitude">经度</param>
  /// <returns>更新位置请求</returns>
  private static UpdateLocationRequest CreateTestUpdateLocationRequest(
      double latitude = 39.9042,
      double longitude = 116.4074)
  {
    return new UpdateLocationRequest
    {
      Latitude = latitude,
      Longitude = longitude
    };
  }

  /// <summary>
  /// 创建测试用的位置查询参数
  /// </summary>
  /// <param name="latitude">纬度</param>
  /// <param name="longitude">经度</param>
  /// <param name="radius">半径</param>
  /// <param name="pageNumber">页码</param>
  /// <param name="pageSize">页大小</param>
  /// <returns>位置查询参数</returns>
  private static LocationQueryParameters CreateTestLocationQueryParameters(
      double latitude = 39.9042,
      double longitude = 116.4074,
      int radius = 5000,
      int pageNumber = 1,
      int pageSize = 10)
  {
    return new LocationQueryParameters
    {
      Latitude = latitude,
      Longitude = longitude,
      Radius = radius,
      PageNumber = pageNumber,
      PageSize = pageSize
    };
  }

  #endregion
}