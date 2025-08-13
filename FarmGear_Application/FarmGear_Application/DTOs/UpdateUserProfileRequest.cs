using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs;

/// <summary>
/// 更新用户信息请求 DTO
/// </summary>
public class UpdateUserProfileRequest
{
  /// <summary>
  /// 用户全名（显示名称）
  /// </summary>
  [Required(ErrorMessage = "Full name is required")]
  [StringLength(100, MinimumLength = 1, ErrorMessage = "Full name must be between 1 and 100 characters")]
  public string FullName { get; set; } = string.Empty;

  /// <summary>
  /// 纬度
  /// </summary>
  [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
  public double? Latitude { get; set; }

  /// <summary>
  /// 经度
  /// </summary>
  [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
  public double? Longitude { get; set; }
}