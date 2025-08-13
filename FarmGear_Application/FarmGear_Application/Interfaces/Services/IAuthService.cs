using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Auth;
using FarmGear_Application.Models;

namespace FarmGear_Application.Interfaces.Services;

/// <summary>
/// Authentication service interface
/// </summary>
public interface IAuthService
{
  /// <summary>
  /// User registration
  /// </summary>
  /// <param name="request">Registration request</param>
  /// <returns>Registration response</returns>
  Task<RegisterResponseDto> RegisterAsync(RegisterRequest request);

  /// <summary>
  /// User login
  /// </summary>
  /// <param name="request">Login request</param>
  /// <returns>Login response</returns>
  Task<LoginResponseDto> LoginAsync(LoginRequest request);

  /// <summary>
  /// User login (with IP address and user agent information)
  /// </summary>
  /// <param name="request">Login request</param>
  /// <param name="ipAddress">IP address</param>
  /// <param name="userAgent">User agent</param>
  /// <returns>Login response</returns>
  Task<LoginResponseDto> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent);

  /// <summary>
  /// Confirm email
  /// </summary>
  /// <param name="userId">User ID</param>
  /// <param name="token">Confirmation token</param>
  /// <returns>Confirmation result</returns>
  Task<ApiResponse> ConfirmEmailAsync(string userId, string token);

  /// <summary>
  /// Send email confirmation link
  /// </summary>
  /// <param name="user">User information</param>
  /// <returns>Send result</returns>
  Task<ApiResponse> SendEmailConfirmationLinkAsync(AppUser user);

  /// <summary>
  /// Check if username is already taken
  /// </summary>
  /// <param name="username">Username</param>
  /// <returns>Whether it's already taken</returns>
  Task<bool> IsUsernameTakenAsync(string username);

  /// <summary>
  /// Check if email is already registered
  /// </summary>
  /// <param name="email">Email</param>
  /// <returns>Whether it's already registered</returns>
  Task<bool> IsEmailTakenAsync(string email);
}