using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Models;

/// <summary>
/// Equipment entity
/// </summary>
public class Equipment
{
  /// <summary>
  /// Equipment ID
  /// </summary>
  [Key]
  public string Id { get; set; } = Guid.NewGuid().ToString();

  /// <summary>
  /// Equipment name
  /// </summary>
  [Required]
  [StringLength(100)]
  public string Name { get; set; } = string.Empty;

  /// <summary>
  /// Equipment description
  /// </summary>
  [StringLength(500)]
  public string Description { get; set; } = string.Empty;

  /// <summary>
  /// Daily rental (yuan)
  /// </summary>
  [Required]
  [Column(TypeName = "decimal(18,2)")]
  public decimal DailyPrice { get; set; }

  /// <summary>
  /// Latitude
  /// </summary>
  [Required]
  [Column(TypeName = "decimal(10,6)")]
  public decimal Latitude { get; set; }

  /// <summary>
  /// Longitude
  /// </summary>
  [Required]
  [Column(TypeName = "decimal(10,6)")]
  public decimal Longitude { get; set; }

  /// <summary>
  /// 设备状态
  /// </summary>
  [Required]
  public EquipmentStatus Status { get; set; }

  /// <summary>
  /// 所有者ID
  /// </summary>
  [Required]
  public string OwnerId { get; set; } = string.Empty;

  /// <summary>
  /// 所有者（导航属性）
  /// </summary>
  [ForeignKey(nameof(OwnerId))]
  public AppUser? Owner { get; set; }

  /// <summary>
  /// 创建时间
  /// </summary>
  [Required]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  /// <summary>
  /// 设备类型
  /// </summary>
  [Required]
  [StringLength(50)]
  public string Type { get; set; } = string.Empty;

  /// <summary>
  /// 设备图片URL
  /// </summary>
  [StringLength(500)]
  public string? ImageUrl { get; set; }

  /// <summary>
  /// 空间位置（用于空间查询）
  /// </summary>
  [NotMapped]
  public string Location => $"POINT({Longitude} {Latitude})";

  /// <summary>
  /// 平均评分
  /// </summary>
  [Column(TypeName = "decimal(3,2)")]
  public decimal AverageRating { get; set; }
}