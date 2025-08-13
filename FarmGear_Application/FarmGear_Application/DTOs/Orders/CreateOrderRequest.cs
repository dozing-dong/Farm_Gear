using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs.Orders;

/// <summary>
/// Create order request DTO
/// </summary>
public class CreateOrderRequest
{
  /// <summary>
  /// Equipment ID
  /// </summary>
  [Required(ErrorMessage = "Equipment ID is required")]
  public string EquipmentId { get; set; } = string.Empty;

  /// <summary>
  /// Start date
  /// </summary>
  [Required(ErrorMessage = "Start date is required")]
  public DateTime StartDate { get; set; }

  /// <summary>
  /// End date
  /// </summary>
  [Required(ErrorMessage = "End date is required")]
  public DateTime EndDate { get; set; }
}