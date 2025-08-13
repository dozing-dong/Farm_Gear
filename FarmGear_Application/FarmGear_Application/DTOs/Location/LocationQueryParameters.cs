using System.ComponentModel.DataAnnotations;
using FarmGear_Application.Enums;
using FarmGear_Application.DTOs.Common;

namespace FarmGear_Application.DTOs.Location;

/// <summary>
/// 位置查询参数
/// </summary>
public class LocationQueryParameters : BaseQueryParameters
{
  /// <summary>
  /// 中心点纬度
  /// </summary>
  [Required]
  [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90 degrees")]
  public double Latitude { get; set; }

  /// <summary>
  /// 中心点经度
  /// </summary>
  [Required]
  [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180 degrees")]
  public double Longitude { get; set; }

  /// <summary>
  /// 搜索半径（米）
  /// </summary>
  [Required]
  [Range(100, 10000, ErrorMessage = "Search radius must be between 100 and 10000 meters")]
  public double Radius { get; set; }



  /// <summary>
  /// 最低价格
  /// </summary>
  [Range(0, double.MaxValue, ErrorMessage = "Minimum price must be greater than or equal to 0")]
  public decimal? MinPrice { get; set; }

  /// <summary>
  /// 最高价格
  /// </summary>
  [Range(0, double.MaxValue, ErrorMessage = "Maximum price must be greater than or equal to 0")]
  public decimal? MaxPrice { get; set; }

  /// <summary>
  /// 设备类型
  /// </summary>
  public string? EquipmentType { get; set; }

  /// <summary>
  /// 设备状态
  /// </summary>
  public EquipmentStatus? Status { get; set; }
}