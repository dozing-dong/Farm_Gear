using FarmGear_Application.Enums;
using FarmGear_Application.DTOs.Common;

namespace FarmGear_Application.DTOs.Orders;

/// <summary>
/// 订单查询参数
/// </summary>
public class OrderQueryParameters : BaseQueryParameters
{

  /// <summary>
  /// 订单状态
  /// </summary>
  public OrderStatus? Status { get; set; }

  /// <summary>
  /// 设备ID
  /// </summary>
  public string? EquipmentId { get; set; }

  /// <summary>
  /// 开始日期范围（开始）
  /// </summary>
  public DateTime? StartDateFrom { get; set; }

  /// <summary>
  /// 开始日期范围（结束）
  /// </summary>
  public DateTime? StartDateTo { get; set; }

  /// <summary>
  /// 结束日期范围（开始）
  /// </summary>
  public DateTime? EndDateFrom { get; set; }

  /// <summary>
  /// 结束日期范围（结束）
  /// </summary>
  public DateTime? EndDateTo { get; set; }

  /// <summary>
  /// 最低总金额
  /// </summary>
  public decimal? MinTotalAmount { get; set; }

  /// <summary>
  /// 最高总金额
  /// </summary>
  public decimal? MaxTotalAmount { get; set; }
}