using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmGear_Application.Models;

/// <summary>
/// Application user class, inherits from IdentityUser
/// </summary>
public class AppUser : IdentityUser
{
  /// <summary>
  /// User full name
  /// </summary>
  public string FullName { get; set; } = string.Empty;

  /// <summary>
  /// Creation time
  /// </summary>
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  /// <summary>
  /// Last login time
  /// </summary>
  public DateTime? LastLoginAt { get; set; }

  /// <summary>
  /// Whether activated
  /// </summary>
  public bool IsActive { get; set; } = true;

  /// <summary>
  /// Latitude
  /// </summary>
  [Column(TypeName = "decimal(10,6)")]
  public decimal? Lat { get; set; }

  /// <summary>
  /// Longitude
  /// </summary>
  [Column(TypeName = "decimal(10,6)")]
  public decimal? Lng { get; set; }

  /// <summary>
  /// Avatar URL
  /// </summary>
  public string? AvatarUrl { get; set; }
}