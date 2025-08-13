using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.Configuration;

/// <summary>
/// Application global configuration
/// </summary>
public class ApplicationSettings
{
  [Required]
  [Url]
  public string ApplicationUrl { get; set; } = string.Empty;

  [Required]
  public FileStorageSettings FileStorage { get; set; } = new();

  public string AllowedHosts { get; set; } = "*";
}

/// <summary>
/// File storage configuration
/// </summary>
public class FileStorageSettings
{
  [Required]
  public string Provider { get; set; } = "Local"; // Local | AWS

  [Required]
  [Url]
  public string BaseUrl { get; set; } = string.Empty;

  [Range(1, 100)]
  public long MaxFileSizeMB { get; set; } = 5;

  public string[] AllowedImageExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

  public string[] AllowedImageMimeTypes { get; set; } = { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };

  public AwsS3Settings AWS { get; set; } = new();
}

/// <summary>
/// AWS S3 storage configuration
/// </summary>
public class AwsS3Settings
{
  public string BucketName { get; set; } = string.Empty;
  public string Region { get; set; } = string.Empty;
  public string AccessKey { get; set; } = string.Empty;
  public string SecretKey { get; set; } = string.Empty;
}