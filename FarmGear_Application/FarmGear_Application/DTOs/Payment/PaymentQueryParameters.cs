using FarmGear_Application.Enums;
using FarmGear_Application.DTOs.Common;

namespace FarmGear_Application.DTOs.Payment;

/// <summary>
/// 支付记录查询参数
/// </summary>
public class PaymentQueryParameters : BaseQueryParameters
{

  /// <summary>
  /// 订单ID
  /// </summary>
  public string? OrderId { get; set; }

  /// <summary>
  /// 用户ID
  /// </summary>
  public string? UserId { get; set; }

  /// <summary>
  /// 支付状态
  /// </summary>
  public PaymentStatus? Status { get; set; }

  /// <summary>
  /// 最小金额
  /// </summary>
  public decimal? MinAmount { get; set; }

  /// <summary>
  /// 最大金额
  /// </summary>
  public decimal? MaxAmount { get; set; }

  /// <summary>
  /// 开始日期
  /// </summary>
  public DateTime? StartDate { get; set; }

  /// <summary>
  /// 结束日期
  /// </summary>
  public DateTime? EndDate { get; set; }

  /// <summary>
  /// 搜索关键词
  /// </summary>
  public string? SearchTerm { get; set; }
}