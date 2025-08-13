using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.Configuration;

/// <summary>
/// JWT configuration class
/// </summary>
public class JwtSettings
{
  /// <summary>
  /// JWT secret key - at least 32 characters
  /// </summary>
  [Required]
  [MinLength(32, ErrorMessage = "JWT secret key requires at least 32 characters")]
  public string SecretKey { get; set; } = string.Empty;

  /// <summary>
  /// Issuer
  /// </summary>
  [Required]
  public string Issuer { get; set; } = string.Empty;

  /// <summary>
  /// Audience
  /// </summary>
  [Required]
  public string Audience { get; set; } = string.Empty;

  /// <summary>
  /// Expiration time (minutes) - 1 minute to 24 hours
  /// </summary>
  [Range(1, 1440, ErrorMessage = "Expiration time must be between 1 minute and 24 hours")]
  public int ExpiryInMinutes { get; set; } = 60;
}