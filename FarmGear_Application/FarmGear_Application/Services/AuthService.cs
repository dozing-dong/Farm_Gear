using FarmGear_Application.Constants;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Auth;
using FarmGear_Application.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Common;
using FarmGear_Application.Interfaces.Services;

namespace FarmGear_Application.Services;

/// <summary>
/// Authentication service implementation
/// </summary>
public class AuthService : IAuthService
{
  private readonly UserManager<AppUser> _userManager;
  private readonly SignInManager<AppUser> _signInManager;
  private readonly EnhancedJwtService _enhancedJwtService;
  private readonly IEmailSender _emailSender;
  private readonly RoleManager<IdentityRole> _roleManager;

  public AuthService(
      UserManager<AppUser> userManager,
      SignInManager<AppUser> signInManager,
      EnhancedJwtService enhancedJwtService,
      IEmailSender emailSender,
      RoleManager<IdentityRole> roleManager)
  {
    _userManager = userManager;
    _signInManager = signInManager;
    _enhancedJwtService = enhancedJwtService;
    _emailSender = emailSender;
    _roleManager = roleManager;
  }

  /// <inheritdoc/>
  public async Task<RegisterResponseDto> RegisterAsync(RegisterRequest request)
  {
    // Validate if role exists
    if (!await _roleManager.RoleExistsAsync(request.Role))
    {
      return new RegisterResponseDto
      {
        Success = false,
        Message = $"Role '{request.Role}' does not exist"
      };
    }

    // Check if username already exists
    if (await _userManager.Users.AnyAsync(u => u.UserName == request.Username))
    {
      return new RegisterResponseDto
      {
        Success = false,
        Message = "Username already exists"
      };
    }

    // Check if email already exists
    if (await _userManager.Users.AnyAsync(u => u.Email == request.Email))
    {
      return new RegisterResponseDto
      {
        Success = false,
        Message = "Email already exists"
      };
    }

    // Create user (excluding Role field)
    var user = new AppUser
    {
      UserName = request.Username,
      Email = request.Email,
      FullName = request.FullName,
      EmailConfirmed = false
      // Remove IsActive setting, use model default value true
    };

    var result = await _userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
    {
      return new RegisterResponseDto
      {
        Success = false,
        Message = string.Join(", ", result.Errors.Select(e => e.Description))
      };
    }

    // Assign role
    var roleResult = await _userManager.AddToRoleAsync(user, request.Role);
    if (!roleResult.Succeeded)
    {
      // If role assignment fails, delete the created user
      await _userManager.DeleteAsync(user);
      return new RegisterResponseDto
      {
        Success = false,
        Message = $"Failed to assign role: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}"
      };
    }

    // Send email confirmation
    await SendEmailConfirmationLinkAsync(user);

    return new RegisterResponseDto
    {
      Success = true,
      Message = "Registration successful. Please check your email to confirm your account.",
      UserId = user.Id
    };
  }

  /// <inheritdoc/>
  public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
  {
    return await LoginAsync(request, null, null);
  }

  /// <summary>
  /// Login logic: supports username or email, checks password, email verification, account activation, returns JWT Token if successful.
  /// </summary>
  /// <param name="request">Login request containing username/email and password</param>
  /// <param name="ipAddress">IP address</param>
  /// <param name="userAgent">User agent</param>
  /// <returns>Login result response object containing status, message and Token (if successful)</returns>
  public async Task<LoginResponseDto> LoginAsync(LoginRequest request, string? ipAddress = null, string? userAgent = null)
  {
    // 1. Find user by username or email
    var user = await _userManager.Users
        .FirstOrDefaultAsync(u => u.UserName == request.UsernameOrEmail || u.Email == request.UsernameOrEmail);

    // 2. If user doesn't exist, return failure message
    if (user == null)
    {
      return new LoginResponseDto
      {
        Success = false,
        Message = "Invalid login credentials"
      };
    }

    // Check if email is already verified (account activation status)
    if (!user.EmailConfirmed)
    {
      return new LoginResponseDto
      {
        Success = false,
        Message = "Account is not activated. Please check your email to confirm your account."
      };
    }

    // Remove IsActive check to avoid duplicate status validation

    // 5. Verify if password is correct
    var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
    if (!result.Succeeded)
    {
      return new LoginResponseDto
      {
        Success = false,
        Message = "Invalid login credentials"
      };
    }

    // 6. Update user's last login time
    user.LastLoginAt = DateTime.UtcNow;
    await _userManager.UpdateAsync(user);

    // 7. Generate JWT Token and cache session information
    var token = await _enhancedJwtService.GenerateTokenWithSessionAsync(user, ipAddress, userAgent);

    // 8. Get user roles
    var roles = await _userManager.GetRolesAsync(user);
    var role = roles.FirstOrDefault() ?? "User";

    // 9. Build user information
    var userInfo = new UserInfoDto
    {
      Id = user.Id,
      Username = user.UserName ?? string.Empty,
      Email = user.Email ?? string.Empty,
      Role = role,
      EmailConfirmed = user.EmailConfirmed
    };

    // 10. Return successful login response
    return new LoginResponseDto
    {
      Success = true,
      Message = "Login successful",
      Token = token,
      UserInfo = userInfo
    };
  }

  /// <inheritdoc/>
  public async Task<ApiResponse> ConfirmEmailAsync(string userId, string token)
  {
    // Query user by userId
    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
      return new ApiResponse
      {
        Success = false,
        Message = "User not found"
      };
    }

    // Verify email token
    var result = await _userManager.ConfirmEmailAsync(user, token);
    if (!result.Succeeded)
    {
      return new ApiResponse
      {
        Success = false,
        Message = string.Join(", ", result.Errors.Select(e => e.Description))
      };
    }

    // Email verification successful, ConfirmEmailAsync automatically sets EmailConfirmed = true
    // Remove extra IsActive setting to avoid redundant operations

    return new ApiResponse
    {
      Success = true,
      Message = "Email confirmed successfully"
    };
  }

  /// <inheritdoc/>
  public async Task<ApiResponse> SendEmailConfirmationLinkAsync(AppUser user)
  {
    // Generate email verification token
    var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

    // Construct email confirmation link
    var confirmationLink = $"https://your-domain.com/api/auth/confirm-email?userId={user.Id}&token={Uri.EscapeDataString(token)}";

    // Send email
    var emailSent = await _emailSender.SendEmailAsync(
        user.Email!,
        "Confirm your email",
        $"Please confirm your account by clicking <a href='{confirmationLink}'>here</a>.");

    return emailSent ?
        new ApiResponse { Success = true, Message = "Confirmation email sent successfully" } :
        new ApiResponse { Success = false, Message = "Failed to send confirmation email" };
  }

  /// <summary>
  /// Check if username is already taken
  /// </summary>
  public async Task<bool> IsUsernameTakenAsync(string username)
  {
    if (string.IsNullOrWhiteSpace(username))
    {
      return false;
    }

    var user = await _userManager.FindByNameAsync(username);
    return user != null;
  }

  /// <summary>
  /// Check if email is already registered
  /// </summary>
  public async Task<bool> IsEmailTakenAsync(string email)
  {
    if (string.IsNullOrWhiteSpace(email))
    {
      return false;
    }

    var user = await _userManager.FindByEmailAsync(email);
    return user != null;
  }
}



/// <summary>
/// Email sender implementation (for testing)
/// </summary>
public class EmailSender : IEmailSender
{
  private readonly ILogger<EmailSender> _logger;

  public EmailSender(ILogger<EmailSender> logger)
  {
    _logger = logger;
  }

  public Task<bool> SendEmailAsync(string email, string subject, string message)
  {
    _logger.LogInformation("Email would be sent to {Email} with subject: {Subject}", email, subject);
    _logger.LogInformation("Email content: {Message}", message);
    return Task.FromResult(true); // Simulate successful sending
  }
}