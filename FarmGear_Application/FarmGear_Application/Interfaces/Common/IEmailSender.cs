namespace FarmGear_Application.Interfaces.Common;

/// <summary>
/// Email sending service interface
/// </summary>
public interface IEmailSender
{
  Task<bool> SendEmailAsync(string email, string subject, string message);
}