using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.Configuration;

/// <summary>
/// 健康检查配置
/// </summary>
public class HealthCheckSettings
{
  /// <summary>
  /// 是否启用健康检查
  /// </summary>
  public bool Enabled { get; set; } = true;

  /// <summary>
  /// 数据库健康检查配置
  /// </summary>
  public DatabaseHealthCheckSettings Database { get; set; } = new();

  /// <summary>
  /// Redis健康检查配置
  /// </summary>
  public RedisHealthCheckSettings Redis { get; set; } = new();

  /// <summary>
  /// 存储健康检查配置
  /// </summary>
  public StorageHealthCheckSettings Storage { get; set; } = new();

  /// <summary>
  /// 健康检查端点配置
  /// </summary>
  public EndpointSettings Endpoints { get; set; } = new();
}

/// <summary>
/// 数据库健康检查配置
/// </summary>
public class DatabaseHealthCheckSettings
{
  /// <summary>
  /// 是否启用数据库健康检查
  /// </summary>
  public bool Enabled { get; set; } = true;

  /// <summary>
  /// 超时时间（秒）
  /// </summary>
  [Range(1, 300)]
  public int TimeoutSeconds { get; set; } = 30;
}

/// <summary>
/// Redis健康检查配置
/// </summary>
public class RedisHealthCheckSettings
{
  /// <summary>
  /// 是否启用Redis健康检查
  /// </summary>
  public bool Enabled { get; set; } = true;

  /// <summary>
  /// 超时时间（秒）
  /// </summary>
  [Range(1, 60)]
  public int TimeoutSeconds { get; set; } = 10;

  /// <summary>
  /// Ping响应时间阈值（毫秒）
  /// </summary>
  [Range(100, 10000)]
  public int PingThresholdMs { get; set; } = 1000;

  /// <summary>
  /// 是否启用详细连接检查
  /// </summary>
  public bool EnableDetailedCheck { get; set; } = true;
}

/// <summary>
/// 存储健康检查配置
/// </summary>
public class StorageHealthCheckSettings
{
  /// <summary>
  /// 是否启用存储健康检查
  /// </summary>
  public bool Enabled { get; set; } = true;

  /// <summary>
  /// 存储类型：Local | AWS
  /// </summary>
  public string Type { get; set; } = "Local";

  /// <summary>
  /// 最小可用空间（GB）
  /// </summary>
  [Range(1, 1000)]
  public long MinFreeSpaceGB { get; set; } = 1;

  /// <summary>
  /// 警告阈值（GB）
  /// </summary>
  [Range(1, 1000)]
  public long WarningThresholdGB { get; set; } = 5;

  /// <summary>
  /// AWS S3配置（当Type为AWS时使用）
  /// </summary>
  public S3HealthCheckSettings S3 { get; set; } = new();
}

/// <summary>
/// S3健康检查配置
/// </summary>
public class S3HealthCheckSettings
{
  /// <summary>
  /// 是否启用S3检查
  /// </summary>
  public bool Enabled { get; set; } = true;

  /// <summary>
  /// 检查存储桶是否可访问
  /// </summary>
  public bool CheckBucketAccess { get; set; } = true;

  /// <summary>
  /// 检查读写权限
  /// </summary>
  public bool CheckReadWritePermissions { get; set; } = true;
}

/// <summary>
/// 健康检查端点配置
/// </summary>
public class EndpointSettings
{
  /// <summary>
  /// 是否启用详细响应
  /// </summary>
  public bool EnableDetailedResponse { get; set; } = true;

  /// <summary>
  /// 是否在生产环境中隐藏敏感信息
  /// </summary>
  public bool HideSensitiveDataInProduction { get; set; } = true;
}