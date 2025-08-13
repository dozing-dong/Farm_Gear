using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.DTOs;

/// <summary>
/// User profile DTO, used to return complete user information
/// </summary>
public class UserProfileDto
{
  /// <summary>
  /// User ID
  /// </summary>
  public string Id { get; set; } = string.Empty;

  /// <summary>
  /// Username (login name)
  /// </summary>
  public string Username { get; set; } = string.Empty;

  /// <summary>
  /// User full name (display name)
  /// </summary>
  public string FullName { get; set; } = string.Empty;

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
  /// Avatar URL
  /// </summary>
  public string? AvatarUrl { get; set; }

  /// <summary>
  /// Creation time
  /// </summary>
  public DateTime CreatedAt { get; set; }

  /// <summary>
  /// Last login time
  /// </summary>
  public DateTime? LastLoginAt { get; set; }

  /// <summary>
  /// Whether activated
  /// </summary>
  public bool IsActive { get; set; }

  /// <summary>
  /// Latitude
  /// </summary>
  public double? Latitude { get; set; }

  /// <summary>
  /// Longitude
  /// </summary>
  public double? Longitude { get; set; }
}