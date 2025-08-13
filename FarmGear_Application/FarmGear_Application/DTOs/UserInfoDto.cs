using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs;

/// <summary>
/// User information DTO, used to return basic information of currently logged-in user
/// </summary>
public class UserInfoDto
{
  /// <summary>
  /// User ID
  /// </summary>
  public string Id { get; set; } = string.Empty;

  /// <summary>
  /// Username
  /// </summary>
  public string Username { get; set; } = string.Empty;

  /// <summary>
  /// Email address
  /// </summary>
  [EmailAddress]
  public string Email { get; set; } = string.Empty;

  /// <summary>
  /// User role
  /// </summary>
  public string Role { get; set; } = string.Empty;

  /// <summary>
  /// Whether email is verified
  /// </summary>
  public bool EmailConfirmed { get; set; }

  /// <summary>
  /// User full name (display name)
  /// </summary>
  public string FullName { get; set; } = string.Empty;

  /// <summary>
  /// Avatar URL
  /// </summary>
  public string? AvatarUrl { get; set; }
}