using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs.Common;

/// <summary>
/// Coordinates base class - contains longitude and latitude fields
/// </summary>
public abstract class BaseCoordinates
{
  /// <summary>
  /// Latitude
  /// </summary>
  [Required(ErrorMessage = "Latitude is required")]
  [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90 degrees")]
  public double Latitude { get; set; }

  /// <summary>
  /// Longitude
  /// </summary>
  [Required(ErrorMessage = "Longitude is required")]
  [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180 degrees")]
  public double Longitude { get; set; }
}