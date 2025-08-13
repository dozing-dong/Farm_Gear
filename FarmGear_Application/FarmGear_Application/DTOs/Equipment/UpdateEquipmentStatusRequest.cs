using System.ComponentModel.DataAnnotations;
using FarmGear_Application.Enums;

namespace FarmGear_Application.DTOs.Equipment;

/// <summary>
/// 更新设备状态请求 DTO
/// </summary>
public class UpdateEquipmentStatusRequest
{
  /// <summary>
  /// 设备状态
  /// </summary>
  [Required(ErrorMessage = "Status is required")]
  public EquipmentStatus Status { get; set; }
}