using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs.Equipment;

/// <summary>
/// Create equipment request DTO
/// </summary>
public class CreateEquipmentRequest
{
  /// <summary>
  /// Equipment name
  /// </summary>
  [Required(ErrorMessage = "Name is required")]
  [StringLength(100, MinimumLength = 2, ErrorMessage = "Name length must be between 2 and 100 characters")]
  public string Name { get; set; } = string.Empty;

  /// <summary>
  /// Equipment description
  /// </summary>
  [Required(ErrorMessage = "Description is required")]
  [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
  public string Description { get; set; } = string.Empty;

  /// <summary>
  /// Daily rental (yuan)
  /// </summary>
  [Required(ErrorMessage = "Daily price is required")]
  [Range(0.01, 10000, ErrorMessage = "Daily price must be between 0.01 and 10000")]
  public decimal DailyPrice { get; set; }

  /// <summary>
  /// Latitude
  /// </summary>
  [Required(ErrorMessage = "Latitude is required")]
  [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
  public double Latitude { get; set; }

  /// <summary>
  /// Longitude
  /// </summary>
  [Required(ErrorMessage = "Longitude is required")]
  [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
  public double Longitude { get; set; }

  /// <summary>
  /// Equipment type
  /// </summary>
  [Required(ErrorMessage = "Type is required")]
  public string Type { get; set; } = string.Empty;

  /// <summary>
  /// Equipment image (optional)
  /// </summary>
  public IFormFile? Image { get; set; }
}