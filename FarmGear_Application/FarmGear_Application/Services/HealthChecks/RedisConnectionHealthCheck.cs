using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using FarmGear_Application.Configuration;
using FarmGear_Application.Interfaces.Services;
using System.Linq;

namespace FarmGear_Application.Services.HealthChecks;

/// <summary>
/// Redis连接健康检查
/// </summary>
public class RedisConnectionHealthCheck : IHealthCheck
{
  private readonly IConnectionMultiplexer _redis;
  private readonly IRedisCacheService _cacheService;
  private readonly HealthCheckSettings _healthSettings;
  private readonly ILogger<RedisConnectionHealthCheck> _logger;

  public RedisConnectionHealthCheck(
      IConnectionMultiplexer redis,
      IRedisCacheService cacheService,
      IOptions<HealthCheckSettings> healthSettings,
      ILogger<RedisConnectionHealthCheck> logger)
  {
    _redis = redis;
    _cacheService = cacheService;
    _healthSettings = healthSettings.Value;
    _logger = logger;
  }

  public async Task<HealthCheckResult> CheckHealthAsync(
      HealthCheckContext context,
      CancellationToken cancellationToken = default)
  {
    try
    {
      var database = _redis.GetDatabase();
      var server = _redis.GetServer(_redis.GetEndPoints().First());

      // 检查基本连接
      var pingResult = await database.PingAsync();
      var isConnected = _redis.IsConnected;

      // 检查Redis服务器信息
      var info = await server.InfoAsync("server");
      var infoLines = info.ToString().Split('\n');
      var redisVersion = infoLines.FirstOrDefault(line => line.StartsWith("redis_version:"))?.Split(':')[1]?.Trim() ?? "unknown";
      var uptimeSeconds = infoLines.FirstOrDefault(line => line.StartsWith("uptime_in_seconds:"))?.Split(':')[1]?.Trim() ?? "unknown";

      // 测试读写操作
      var testKey = $"healthcheck:{Guid.NewGuid()}";
      var testValue = DateTime.UtcNow.ToString();

      await database.StringSetAsync(testKey, testValue, TimeSpan.FromSeconds(10));
      var retrievedValue = await database.StringGetAsync(testKey);
      await database.KeyDeleteAsync(testKey);

      var data = new Dictionary<string, object>
      {
        ["is_connected"] = isConnected,
        ["ping_ms"] = pingResult.TotalMilliseconds,
        ["redis_version"] = redisVersion ?? "unknown",
        ["uptime_seconds"] = uptimeSeconds ?? "unknown",
        ["read_write_test"] = retrievedValue == testValue ? "passed" : "failed"
      };

      if (!isConnected)
      {
        return HealthCheckResult.Unhealthy(
            "Redis connection is not established",
            data: data);
      }

      // 使用配置中的ping阈值
      var pingThreshold = _healthSettings.Redis.PingThresholdMs;

      if (pingResult.TotalMilliseconds > pingThreshold)
      {
        return HealthCheckResult.Degraded(
            $"Redis response time is slow: {pingResult.TotalMilliseconds:F2}ms (threshold: {pingThreshold}ms)",
            data: data);
      }

      if (retrievedValue != testValue)
      {
        return HealthCheckResult.Unhealthy(
            "Redis read/write test failed",
            data: data);
      }

      return HealthCheckResult.Healthy(
          $"Redis is healthy. Ping: {pingResult.TotalMilliseconds:F2}ms",
          data: data);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Redis health check failed");
      return HealthCheckResult.Unhealthy(
          "Redis health check failed",
          ex,
          new Dictionary<string, object> { ["error"] = ex.Message });
    }
  }
}