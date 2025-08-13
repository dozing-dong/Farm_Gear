using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using FarmGear_Application.Configuration;

namespace FarmGear_Application.Services.HealthChecks;

/// <summary>
/// 文件系统健康检查
/// </summary>
public class FileSystemHealthCheck : IHealthCheck
{
  private readonly ApplicationSettings _appSettings;
  private readonly HealthCheckSettings _healthSettings;
  private readonly ILogger<FileSystemHealthCheck> _logger;

  public FileSystemHealthCheck(
      IOptions<ApplicationSettings> appSettings,
      IOptions<HealthCheckSettings> healthSettings,
      ILogger<FileSystemHealthCheck> logger)
  {
    _appSettings = appSettings.Value;
    _healthSettings = healthSettings.Value;
    _logger = logger;
  }

  public async Task<HealthCheckResult> CheckHealthAsync(
      HealthCheckContext context,
      CancellationToken cancellationToken = default)
  {
    try
    {
      // 检查上传目录是否存在和可写
      var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

      if (!Directory.Exists(uploadsPath))
      {
        Directory.CreateDirectory(uploadsPath);
      }

      // 尝试创建测试文件来验证写入权限
      var testFilePath = Path.Combine(uploadsPath, $"healthcheck_{Guid.NewGuid()}.tmp");
      await File.WriteAllTextAsync(testFilePath, "health check test", cancellationToken);
      File.Delete(testFilePath);

      // 检查磁盘空间
      var driveInfo = new DriveInfo(Path.GetPathRoot(uploadsPath) ?? "/");
      var freeSpaceGB = driveInfo.AvailableFreeSpace / (1024 * 1024 * 1024);

      var data = new Dictionary<string, object>
      {
        ["uploads_path"] = uploadsPath,
        ["free_space_gb"] = freeSpaceGB,
        ["drive_format"] = driveInfo.DriveFormat,
        ["total_space_gb"] = driveInfo.TotalSize / (1024 * 1024 * 1024)
      };

      // 使用配置中的阈值
      var minFreeSpace = _healthSettings.Storage.MinFreeSpaceGB;
      var warningThreshold = _healthSettings.Storage.WarningThresholdGB;

      // 如果可用空间少于最小要求，标记为不健康
      if (freeSpaceGB < minFreeSpace)
      {
        return HealthCheckResult.Unhealthy(
            $"Low disk space: {freeSpaceGB:F2} GB available (minimum required: {minFreeSpace} GB)",
            data: data);
      }

      // 如果可用空间少于警告阈值，标记为降级
      if (freeSpaceGB < warningThreshold)
      {
        return HealthCheckResult.Degraded(
            $"Disk space running low: {freeSpaceGB:F2} GB available (warning threshold: {warningThreshold} GB)",
            data: data);
      }

      return HealthCheckResult.Healthy(
          $"File system is healthy. Available space: {freeSpaceGB:F2} GB",
          data: data);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "File system health check failed");
      return HealthCheckResult.Unhealthy(
          "File system check failed",
          ex,
          new Dictionary<string, object> { ["error"] = ex.Message });
    }
  }
}