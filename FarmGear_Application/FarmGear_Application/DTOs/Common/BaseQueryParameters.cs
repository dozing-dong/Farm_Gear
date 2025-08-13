using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs.Common;

/// <summary>
/// 查询参数基类 - 包含通用的分页和排序字段
/// </summary>
public abstract class BaseQueryParameters
{
  /// <summary>
  /// 页码（从1开始）
  /// </summary>
  [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
  public int PageNumber { get; set; } = 1;

  /// <summary>
  /// 每页大小
  /// </summary>
  [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
  public int PageSize { get; set; } = 10;

  /// <summary>
  /// 排序字段
  /// </summary>
  public string? SortBy { get; set; }

  /// <summary>
  /// 是否升序
  /// </summary>
  public bool IsAscending { get; set; } = true;
}