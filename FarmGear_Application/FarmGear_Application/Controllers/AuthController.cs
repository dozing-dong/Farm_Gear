using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Auth;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Models;
using FarmGear_Application.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Linq;

namespace FarmGear_Application.Controllers;

/// <summary>
/// Authentication controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
  private readonly IAuthService _authService;
  private readonly ILogger<AuthController> _logger;
  private readonly UserManager<AppUser> _userManager;
  private readonly IWebHostEnvironment _environment;
  private readonly JwtSettings _jwtSettings;

  public AuthController(
      IAuthService authService,
      ILogger<AuthController> logger,
      UserManager<AppUser> userManager,
      IWebHostEnvironment environment,
      IOptions<JwtSettings> jwtSettings)
  {
    _authService = authService;
    _logger = logger;
    _userManager = userManager;
    _environment = environment;
    _jwtSettings = jwtSettings.Value;
  }

  /// <summary>
  /// Create unified cookie configuration options
  /// </summary>
  /// <param name="expiresInMinutes">Expiration time (minutes)</param>
  /// <returns>Cookie configuration options</returns>
  private CookieOptions CreateCookieOptions(int? expiresInMinutes = null)
  {
    // 🔧 Use unified environment checking and configuration
    var expiry = expiresInMinutes ?? _jwtSettings.ExpiryInMinutes;
    var isDevelopment = _environment.IsDevelopment();

    return new CookieOptions
    {
      HttpOnly = true,
      // 🔒 Simplified: All environments use HTTPS, unified setting to true
      Secure = true,
      // 🔒 Simplified: All environments use HTTPS, unified use Strict mode for enhanced security
      SameSite = SameSiteMode.Strict,
      Expires = expiresInMinutes.HasValue ? DateTime.UtcNow.AddMinutes(expiry) : null,
      Path = "/",
      // 🔒 Retain Domain distinction: Different handling methods for development environment (localhost) and production environment (domain)
      Domain = isDevelopment ? null : GetSecureDomain(),
      // 🔒 Security enhancement: Set as session cookie (if no expiration time specified)
      IsEssential = true
    };
  }

  /// <summary>
  /// Get secure cookie domain setting
  /// </summary>
  /// <returns>Secure domain configuration</returns>
  private string? GetSecureDomain()
  {
    // In production environment, explicitly set domain to enhance security
    // Avoid subdomains being able to access authentication cookies
    var host = HttpContext.Request.Host.Host;

    // If it's IP address, return null (Cookie specification requirement)
    if (System.Net.IPAddress.TryParse(host, out _))
    {
      return null;
    }

    // For domain name, return current hostname
    return host;
  }

  /// <summary>
  /// User registration
  /// </summary>
  /// <param name="request">Registration request</param>
  /// <returns>Registration response</returns>
  /// <response code="201">Registration successful</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="409">Username or email already exists</response>
  /// <response code="500">Internal server error</response>
  [HttpPost("register")]
  [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status201Created)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> Register([FromBody] RegisterRequest request)
  {
    try
    {
      var response = await _authService.RegisterAsync(request);

      if (!response.Success)
      {
        // Return different status codes based on error type
        if (response.Message.Contains("already exists"))
        {
          return Conflict(new ApiResponse
          {
            Success = false,
            Message = response.Message
          });
        }

        return BadRequest(new ApiResponse
        {
          Success = false,
          Message = response.Message
        });
      }

      return CreatedAtAction(nameof(GetCurrentUser), new { }, response);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred during registration");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred during registration"
      });
    }
  }

  /// <summary>
  /// User login
  /// </summary>
  /// <param name="request">Login request</param>
  /// <returns>Login response</returns>
  /// <response code="200">Login successful</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="401">Username or password error</response>
  /// <response code="403">Account not activated or email not confirmed</response>
  /// <response code="500">Internal server error</response>
  [HttpPost("login")]
  [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> Login([FromBody] LoginRequest request)
  {
    try
    {
      // Get client IP address
      var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

      // Get user agent
      var userAgent = Request.Headers["User-Agent"].FirstOrDefault();

      var response = await _authService.LoginAsync(request, ipAddress, userAgent);

      if (!response.Success)
      {
        // Return different status codes based on error type
        if (response.Message.Contains("Invalid login credentials"))
        {
          return Unauthorized(new ApiResponse
          {
            Success = false,
            Message = response.Message
          });
        }

        if (response.Message.Contains("not confirmed") ||
            response.Message.Contains("not activated"))
        {
          return Forbid();
        }

        return BadRequest(new ApiResponse
        {
          Success = false,
          Message = response.Message
        });
      }

      // Login successful, set HttpOnly Cookie
      if (!string.IsNullOrEmpty(response.Token))
      {
        // 🔒 Use default expiration time from configuration, explicitly specify expiration time
        var cookieOptions = CreateCookieOptions(_jwtSettings.ExpiryInMinutes);

        Response.Cookies.Append("auth-token", response.Token, cookieOptions);

        // Clear Token in response, don't return via JSON
        response.Token = null;

        _logger.LogInformation("Set HttpOnly cookie for user login - Secure: {Secure}, SameSite: {SameSite}",
                              cookieOptions.Secure, cookieOptions.SameSite);
      }

      return Ok(response);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred during login");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred during login"
      });
    }
  }

  /// <summary>
  /// User logout
  /// </summary>
  /// <returns>Generic response</returns>
  /// <response code="200">Logout successful</response>
  /// <response code="401">Unauthorized</response>
  [HttpPost("logout")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  public async Task<IActionResult> Logout()
  {
    try
    {
      // Get token from HttpOnly Cookie
      var token = Request.Cookies["auth-token"];

      if (!string.IsNullOrEmpty(token))
      {
        // Add token to blacklist
        var enhancedJwtService = HttpContext.RequestServices.GetRequiredService<EnhancedJwtService>();
        await enhancedJwtService.InvalidateTokenAsync(token);

        _logger.LogInformation("Added token to blacklist during logout");
      }

      // Clear HttpOnly Cookie
      var cookieOptions = CreateCookieOptions(-1440); // -1440 minutes (-1 day) = expired deletion

      Response.Cookies.Append("auth-token", "", cookieOptions);

      _logger.LogInformation("Cleared HttpOnly cookie during logout - Secure: {Secure}, SameSite: {SameSite}",
                            cookieOptions.Secure, cookieOptions.SameSite);

      return Ok(new ApiResponse
      {
        Success = true,
        Message = "Logout successful"
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred during logout");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred during logout"
      });
    }
  }

  /// <summary>
  /// Confirm email
  /// </summary>
  /// <param name="userId">User ID</param>
  /// <param name="token">Confirmation Token</param>
  /// <returns>Generic response</returns>
  /// <response code="200">Email confirmation successful</response>
  /// <response code="400">Token invalid or expired</response>
  /// <response code="404">User does not exist</response>
  /// <response code="500">Internal server error</response>
  [HttpGet("confirm-email")]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
  {
    try
    {
      if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
      {
        return BadRequest(new ApiResponse
        {
          Success = false,
          Message = "User ID and token are required"
        });
      }

      // Some clients may not properly URL encode '+', causing server to receive spaces and validation failure
      var normalizedToken = token.Replace(" ", "+");

      var response = await _authService.ConfirmEmailAsync(userId, normalizedToken);

      if (!response.Success)
      {
        if (response.Message.Contains("User not found"))
        {
          return NotFound(new ApiResponse
          {
            Success = false,
            Message = response.Message
          });
        }

        return BadRequest(new ApiResponse
        {
          Success = false,
          Message = response.Message
        });
      }

      return Ok(response);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred during email confirmation");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred during email confirmation"
      });
    }
  }

  /// <summary>
  /// Get current logged-in user information
  /// </summary>
  /// <returns>User information</returns>
  /// <response code="200">Successfully retrieved</response>
  /// <response code="401">Unauthorized</response>
  /// <response code="404">User does not exist</response>
  /// <response code="500">Internal server error</response>
  [HttpGet("me")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<UserInfoDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]

  public async Task<IActionResult> GetCurrentUser()
  {
    try
    {
      // Get user ID from Claims
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return Unauthorized(new ApiResponse
        {
          Success = false,
          Message = "User not authenticated - User ID claim not found"
        });
      }

      // Get user information
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return NotFound(new ApiResponse
        {
          Success = false,
          Message = "User not found"
        });
      }

      // Get user roles
      var roles = await _userManager.GetRolesAsync(user);
      var role = roles.FirstOrDefault() ?? "User";

      // Build return DTO
      var userInfo = new UserInfoDto
      {
        Id = user.Id,
        Username = user.UserName ?? string.Empty,
        Email = user.Email ?? string.Empty,
        Role = role,
        EmailConfirmed = user.EmailConfirmed,
        FullName = user.FullName,
        AvatarUrl = user.AvatarUrl
      };

      return Ok(new ApiResponse<UserInfoDto>
      {
        Success = true,
        Message = "User information retrieved successfully",
        Data = userInfo
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while getting current user info");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred while getting user information"
      });
    }
  }

  /// <summary>
  /// Temporary test interface: Get email confirmation Token (for development testing only)
  /// </summary>
  /// <param name="userId">User ID</param>
  /// <returns>Confirmation Token</returns>
  [HttpGet("get-confirmation-token/{userId}")]
  [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  public async Task<IActionResult> GetConfirmationToken(string userId)
  {
    try
    {
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return NotFound(new ApiResponse
        {
          Success = false,
          Message = "User not found"
        });
      }

      var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

      return Ok(new
      {
        UserId = userId,
        Token = token,
        ConfirmationUrl = $"http://localhost:5136/api/auth/confirm-email?userId={userId}&token={Uri.EscapeDataString(token)}"
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error generating confirmation token for user {UserId}", userId);
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred while generating confirmation token"
      });
    }
  }
}