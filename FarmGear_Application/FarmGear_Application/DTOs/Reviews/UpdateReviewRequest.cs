using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs.Reviews;

/// <summary>
/// 更新评论请求
/// </summary>
public class UpdateReviewRequest
{
  /// <summary>
  /// 评分（1-5分）
  /// </summary>
  [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
  public int Rating { get; set; }

  /// <summary>
  /// 评论内容
  /// </summary>
  [StringLength(1000, ErrorMessage = "Content cannot exceed 1000 characters")]
  public string? Content { get; set; }
}