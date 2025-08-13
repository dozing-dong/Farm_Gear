using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs;

/// <summary>
/// Login request DTO
/// </summary>
public class LoginRequest
{
  /// <summary>
  /// Username or email (required)
  /// </summary>
  [Required(ErrorMessage = "Username or email is required")]
  public string UsernameOrEmail { get; set; } = string.Empty;

  /// <summary>
  /// Password (required)
  /// </summary>
  [Required(ErrorMessage = "Password is required")]
  public string Password { get; set; } = string.Empty;

  /// <summary>
  /// Remember me (optional, default false)
  /// </summary>
  public bool RememberMe { get; set; }
}