using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using FarmGear_Application.Configuration;
using FarmGear_Application.Services.HealthChecks;
using FarmGear_Application.Data;
using System.Text.Json;

namespace FarmGear_Application.Extensions;

/// <summary>
/// 健康检查扩展方法
/// </summary>
public static class HealthCheckExtensions
{
  /// <summary>
  /// 添加环境感知的健康检查
  /// </summary>
  public static IServiceCollection AddEnvironmentAwareHealthChecks(
      this IServiceCollection services,
      IConfiguration configuration,
      IWebHostEnvironment environment)
  {
    var healthCheckSettings = configuration.GetSection("HealthCheck").Get<HealthCheckSettings>() ?? new();

    if (!healthCheckSettings.Enabled)
    {
      // 添加最基本的自检
      services.AddHealthChecks()
          .AddCheck("self", () => HealthCheckResult.Healthy("Health checks disabled"));
      return services;
    }

    // 注册自定义健康检查服务
    services.AddScoped<FileSystemHealthCheck>();
    services.AddScoped<RedisConnectionHealthCheck>();

    var healthChecksBuilder = services.AddHealthChecks();

    // 数据库检查 - 智能配置
    if (healthCheckSettings.Database.Enabled)
    {
      healthChecksBuilder.AddDbContextCheck<ApplicationDbContext>(
          name: "database",
          tags: new[] { "ready", "db" });
    }

    // Redis检查 - 安全配置读取
    if (healthCheckSettings.Redis.Enabled)
    {
      var redisConnectionString = GetRedisConnectionString(configuration, environment);
      if (!string.IsNullOrEmpty(redisConnectionString))
      {
        try
        {
          healthChecksBuilder.AddRedis(
              redisConnectionString,
              name: "redis",
              tags: new[] { "ready", "cache" });

          if (healthCheckSettings.Redis.EnableDetailedCheck)
          {
            healthChecksBuilder.AddCheck<RedisConnectionHealthCheck>(
                name: "redis_connection",
                tags: new[] { "ready", "cache", "connection" });
          }
        }
        catch (Exception ex)
        {
          // 如果Redis配置有问题，降级为仅记录警告
          healthChecksBuilder.AddCheck("redis_config_warning",
              () => HealthCheckResult.Degraded($"Redis configuration issue: {ex.Message}"));
        }
      }
      else if (environment.IsDevelopment())
      {
        // 开发环境如果没有Redis配置，添加警告而不是失败
        healthChecksBuilder.AddCheck("redis_dev_warning",
            () => HealthCheckResult.Degraded("Redis not configured in development"));
      }
    }

    // 存储检查 - 环境感知
    if (healthCheckSettings.Storage.Enabled)
    {
      var storageType = GetStorageType(configuration, environment);

      if (storageType == "Local" || environment.IsDevelopment())
      {
        healthChecksBuilder.AddCheck<FileSystemHealthCheck>(
            name: "storage",
            tags: new[] { "ready", "storage" });
      }
      else if (storageType == "AWS")
      {
        // AWS S3检查 - 预留给未来实现
        healthChecksBuilder.AddCheck("storage_s3_placeholder",
            () => HealthCheckResult.Healthy("S3 health check - placeholder for future implementation"));
      }
    }

    // 应用自检
    healthChecksBuilder.AddCheck(
        "self",
        () => HealthCheckResult.Healthy("Application is running"),
        tags: new[] { "live" });

    return services;
  }

  /// <summary>
  /// 配置健康检查端点
  /// </summary>
  public static WebApplication MapEnvironmentAwareHealthCheckEndpoints(
      this WebApplication app,
      IConfiguration configuration,
      IWebHostEnvironment environment)
  {
    var healthCheckSettings = configuration.GetSection("HealthCheck").Get<HealthCheckSettings>() ?? new();

    if (!healthCheckSettings.Enabled)
    {
      return app;
    }

    var enableDetailedResponse = healthCheckSettings.Endpoints.EnableDetailedResponse;
    var hideSensitiveData = healthCheckSettings.Endpoints.HideSensitiveDataInProduction &&
                           environment.IsProduction();

    // 🏥 完整健康检查端点
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
      ResponseWriter = async (context, report) =>
      {
        context.Response.ContentType = "application/json; charset=utf-8";

        var response = new
        {
          status = report.Status.ToString(),
          environment = environment.EnvironmentName,
          totalDuration = report.TotalDuration.TotalMilliseconds,
          checks = enableDetailedResponse ? report.Entries.Select(x => new
          {
            name = x.Key,
            status = x.Value.Status.ToString(),
            description = x.Value.Description,
            duration = x.Value.Duration.TotalMilliseconds,
            tags = x.Value.Tags,
            exception = hideSensitiveData ? null : x.Value.Exception?.Message,
            data = hideSensitiveData ? new Dictionary<string, object>() : x.Value.Data
          }) : null,
          timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
          WriteIndented = !environment.IsProduction(),
          PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
      }
    });

    // 🏥 就绪状态检查 - 用于负载均衡器和Kubernetes readiness probe
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
      Predicate = check => check.Tags.Contains("ready"),
      ResponseWriter = async (context, report) =>
      {
        context.Response.ContentType = "application/json; charset=utf-8";
        var response = new
        {
          status = report.Status.ToString(),
          timestamp = DateTime.UtcNow,
          environment = environment.EnvironmentName
        };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
      }
    });

    // 🏥 存活状态检查 - 用于Kubernetes liveness probe  
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
      Predicate = check => check.Tags.Contains("live"),
      ResponseWriter = async (context, report) =>
      {
        context.Response.ContentType = "application/json; charset=utf-8";
        var response = new
        {
          status = report.Status.ToString(),
          timestamp = DateTime.UtcNow,
          environment = environment.EnvironmentName
        };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
      }
    });

    return app;
  }

  /// <summary>
  /// 获取Redis连接字符串 - 统一使用RedisSettings配置
  /// </summary>
  private static string? GetRedisConnectionString(IConfiguration configuration, IWebHostEnvironment environment)
  {
    // 🔧 统一使用RedisSettings配置，与业务代码保持一致
    var redisConnection = configuration.GetSection("RedisSettings:ConnectionString").Value;

    if (string.IsNullOrEmpty(redisConnection) && environment.IsDevelopment())
    {
      // 开发环境容错 - 如果完全没有配置，使用默认值
      redisConnection = "localhost:6379";
    }

    return redisConnection;
  }

  /// <summary>
  /// 获取存储类型 - 环境感知
  /// </summary>
  private static string GetStorageType(IConfiguration configuration, IWebHostEnvironment environment)
  {
    // 检查应用设置中的存储提供商配置
    var storageProvider = configuration.GetSection("ApplicationSettings:FileStorage:Provider").Value;

    if (!string.IsNullOrEmpty(storageProvider))
    {
      return storageProvider == "AWS" ? "AWS" : "Local";
    }

    // 检查健康检查配置中的存储类型
    var storageType = configuration.GetSection("HealthCheck:Storage:Type").Value;

    if (!string.IsNullOrEmpty(storageType))
    {
      return storageType;
    }

    // 默认：开发环境使用Local，生产环境使用AWS
    return environment.IsDevelopment() ? "Local" : "AWS";
  }
}