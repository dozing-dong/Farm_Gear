using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.Configuration;

/// <summary>
/// Email service configuration
/// </summary>
public class EmailSettings
{
  [Required]
  public string Provider { get; set; } = "SMTP"; // SMTP | AWS

  [Required]
  [EmailAddress]
  public string FromEmail { get; set; } = string.Empty;

  [Required]
  public string FromName { get; set; } = string.Empty;

  public SmtpSettings SMTP { get; set; } = new();

  public AwsSesSettings AWS { get; set; } = new();
}

/// <summary>
/// SMTP email configuration
/// </summary>
public class SmtpSettings
{
  public string Server { get; set; } = string.Empty;
  public int Port { get; set; } = 587;
  public bool UseSsl { get; set; } = true;
  public string Username { get; set; } = string.Empty;
  public string Password { get; set; } = string.Empty;
}

/// <summary>
/// AWS SES email configuration
/// </summary>
public class AwsSesSettings
{
  public string Region { get; set; } = string.Empty;
  public string AccessKey { get; set; } = string.Empty;
  public string SecretKey { get; set; } = string.Empty;
}