using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmGear_Application.Models;

/// <summary>
/// Review model
/// </summary>
public class Review
{
  /// <summary>
  /// Review ID
  /// </summary>
  [Key]
  public string Id { get; set; } = Guid.NewGuid().ToString();

  /// <summary>
  /// Equipment ID
  /// </summary>
  [Required]
  public string EquipmentId { get; set; } = string.Empty;

  /// <summary>
  /// Equipment
  /// </summary>
  [ForeignKey(nameof(EquipmentId))]
  public Equipment? Equipment { get; set; }

  /// <summary>
  /// Order ID
  /// </summary>
  [Required]
  public string OrderId { get; set; } = string.Empty;

  /// <summary>
  /// Order
  /// </summary>
  [ForeignKey(nameof(OrderId))]
  public Order? Order { get; set; }

  /// <summary>
  /// User ID
  /// </summary>
  [Required]
  public string UserId { get; set; } = string.Empty;

  /// <summary>
  /// User
  /// </summary>
  [ForeignKey(nameof(UserId))]
  public AppUser? User { get; set; }

  /// <summary>
  /// Rating (1-5)
  /// </summary>
  [Required]
  [Range(1, 5)]
  public int Rating { get; set; }

  /// <summary>
  /// 评论内容
  /// </summary>
  [MaxLength(500)]
  public string? Content { get; set; }

  /// <summary>
  /// 创建时间
  /// </summary>
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  /// <summary>
  /// 更新时间
  /// </summary>
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}