using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.Configuration;

/// <summary>
/// Redis cache configuration
/// </summary>
public class RedisSettings
{
  [Required]
  public string ConnectionString { get; set; } = string.Empty;

  [Range(0, 15)]
  public int DatabaseId { get; set; } = 0;

  [Range(1, 3600)]
  public int DefaultExpirationMinutes { get; set; } = 60;
}