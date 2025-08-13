using FarmGear_Application.DTOs.Common;

namespace FarmGear_Application.DTOs.Reviews;

/// <summary>
/// 评论查询参数
/// </summary>
public class ReviewQueryParameters : BaseQueryParameters
{
  private const int MaxPageSize = 50;
  private int _pageSize = 10;

  /// <summary>
  /// 每页大小（1-50）
  /// </summary>
  public new int PageSize
  {
    get => _pageSize;
    set => _pageSize = Math.Min(value, MaxPageSize);
  }

  /// <summary>
  /// 设备ID
  /// </summary>
  public string? EquipmentId { get; set; }

  /// <summary>
  /// 用户ID
  /// </summary>
  public string? UserId { get; set; }

  /// <summary>
  /// 最低评分
  /// </summary>
  public int? MinRating { get; set; }

  /// <summary>
  /// 最高评分
  /// </summary>
  public int? MaxRating { get; set; }

  /// <summary>
  /// 开始时间
  /// </summary>
  public DateTime? StartDate { get; set; }

  /// <summary>
  /// 结束时间
  /// </summary>
  public DateTime? EndDate { get; set; }

  /// <summary>
  /// 是否升序（默认降序）
  /// </summary>
  public new bool IsAscending { get; set; } = false;
}