using FarmGear_Application.Enums;
using FarmGear_Application.DTOs.Common;

namespace FarmGear_Application.DTOs.Equipment;

/// <summary>
/// 设备查询参数
/// </summary>
public class EquipmentQueryParameters : BaseQueryParameters
{

  /// <summary>
  /// 搜索关键词（设备名称或描述）
  /// </summary>
  public string? SearchTerm { get; set; }

  /// <summary>
  /// 最低日租金
  /// </summary>
  public decimal? MinDailyPrice { get; set; }

  /// <summary>
  /// 最高日租金
  /// </summary>
  public decimal? MaxDailyPrice { get; set; }

  /// <summary>
  /// 设备状态
  /// </summary>
  public EquipmentStatus? Status { get; set; }

  /// <summary>
  /// 设备类型
  /// </summary>
  public string? Type { get; set; }
}