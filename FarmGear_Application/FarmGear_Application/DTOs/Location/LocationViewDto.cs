using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs.Location;

/// <summary>
/// 位置视图 DTO
/// </summary>
public class LocationViewDto
{
  /// <summary>
  /// 用户ID
  /// </summary>
  public string UserId { get; set; } = string.Empty;

  /// <summary>
  /// 用户名
  /// </summary>
  public string Username { get; set; } = string.Empty;

  /// <summary>
  /// 纬度
  /// </summary>
  public double Latitude { get; set; }

  /// <summary>
  /// 经度
  /// </summary>
  public double Longitude { get; set; }

  /// <summary>
  /// 更新时间
  /// </summary>
  public DateTime UpdatedAt { get; set; }
}