using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Models;

/// <summary>
/// Order entity
/// </summary>
public class Order
{
  /// <summary>
  /// Order ID
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
  [ForeignKey("EquipmentId")]
  public Equipment? Equipment { get; set; }

  /// <summary>
  /// Renter ID
  /// </summary>
  [Required]
  public string RenterId { get; set; } = string.Empty;

  /// <summary>
  /// Renter
  /// </summary>
  [ForeignKey("RenterId")]
  public AppUser? Renter { get; set; }

  /// <summary>
  /// Start date
  /// </summary>
  [Required]
  public DateTime StartDate { get; set; }

  /// <summary>
  /// End date
  /// </summary>
  [Required]
  public DateTime EndDate { get; set; }

  /// <summary>
  /// 订单状态
  /// </summary>
  [Required]
  public OrderStatus Status { get; set; } = OrderStatus.Pending;

  /// <summary>
  /// 总金额
  /// </summary>
  [Required]
  [Column(TypeName = "decimal(18,2)")]
  public decimal TotalAmount { get; set; }

  /// <summary>
  /// 创建时间
  /// </summary>
  [Required]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  /// <summary>
  /// 更新时间
  /// </summary>
  public DateTime? UpdatedAt { get; set; }
}