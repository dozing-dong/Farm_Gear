using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs;

/// <summary>
/// Registration request DTO
/// </summary>
public class RegisterRequest
{
  /// <summary>
  /// Username
  /// </summary>
  [Required(ErrorMessage = "Username is required")]
  [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
  public string Username { get; set; } = string.Empty;

  /// <summary>
  /// Email
  /// </summary>
  [Required(ErrorMessage = "Email is required")]
  [EmailAddress(ErrorMessage = "Invalid email address")]
  public string Email { get; set; } = string.Empty;

  /// <summary>
  /// Password
  /// </summary>
  [Required(ErrorMessage = "Password is required")]
  [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
  public string Password { get; set; } = string.Empty;

  /// <summary>
  /// Confirm password (optional, but must match Password)
  /// </summary>
  [Compare("Password", ErrorMessage = "Passwords do not match")]
  public string ConfirmPassword { get; set; } = string.Empty;

  /// <summary>
  /// Full name (optional)
  /// </summary>
  [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
  public string FullName { get; set; } = string.Empty;

  /// <summary>
  /// User role
  /// </summary>
  [Required(ErrorMessage = "Role is required")]
  public string Role { get; set; } = string.Empty;
}