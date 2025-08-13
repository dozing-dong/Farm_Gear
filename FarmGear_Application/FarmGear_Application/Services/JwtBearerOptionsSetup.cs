using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using FarmGear_Application.Configuration;
using FarmGear_Application.Interfaces.Services;

namespace FarmGear_Application.Services;

/// <summary>
/// JWT Bearer 认证配置设置
/// </summary>
public class JwtBearerOptionsSetup : IConfigureNamedOptions<JwtBearerOptions>
{
  private readonly JwtSettings _jwtSettings;
  private readonly ILogger<JwtBearerOptionsSetup> _logger;
  private readonly IRedisCacheService _cacheService;

  public JwtBearerOptionsSetup(
      IOptions<JwtSettings> jwtSettings,
      ILogger<JwtBearerOptionsSetup> logger,
      IRedisCacheService cacheService)
  {
    _jwtSettings = jwtSettings.Value;
    _logger = logger;
    _cacheService = cacheService;
  }

  public void Configure(string? name, JwtBearerOptions options)
  {
    if (name == JwtBearerDefaults.AuthenticationScheme)
    {
      // 🔧 配置JWT验证参数
      var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

      options.TokenValidationParameters = new TokenValidationParameters
      {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = _jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = _jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero, // 减少时钟偏差容忍度
        RequireExpirationTime = true,
        RequireSignedTokens = true,
        // 🔧 配置标准claims映射
        NameClaimType = "name",
        RoleClaimType = ClaimTypes.Role
      };

      // 添加JWT认证事件处理器
      options.Events = new JwtBearerEvents
      {
        OnMessageReceived = context =>
        {
          // 🔧 统一使用HttpOnly Cookie认证方式
          // 从Cookie中获取token
          if (context.Request.Cookies.ContainsKey("auth-token"))
          {
            context.Token = context.Request.Cookies["auth-token"];
            _logger.LogInformation("Token received from HttpOnly cookie");
          }

          return Task.CompletedTask;
        },

        OnTokenValidated = async context =>
        {
          try
          {
            // 🔧 调试：记录所有claims信息
            _logger.LogInformation("=== JWT Token Validated ===");
            _logger.LogInformation("Claims count: {Count}", context.Principal?.Claims.Count() ?? 0);

            foreach (var claim in context.Principal?.Claims ?? Enumerable.Empty<System.Security.Claims.Claim>())
            {
              _logger.LogInformation("Claim - Type: {Type}, Value: {Value}", claim.Type, claim.Value);
            }

            // 在Token验证成功后检查黑名单
            // 🔧 从Cookie获取token字符串进行黑名单检查
            string? tokenString = null;

            // 从Cookie获取token
            if (context.Request.Cookies.ContainsKey("auth-token"))
            {
              tokenString = context.Request.Cookies["auth-token"];
            }

            if (!string.IsNullOrEmpty(tokenString))
            {
              var isBlacklisted = await _cacheService.IsTokenBlacklistedAsync(tokenString);
              if (isBlacklisted)
              {
                _logger.LogWarning("Token is blacklisted");
                context.Fail("Token has been invalidated");
                return;
              }
            }
            else
            {
              _logger.LogWarning("Could not retrieve token string for blacklist check");
            }

            var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("JWT Token validated successfully for user: {UserId}", userId ?? "NULL");
          }
          catch (Exception ex)
          {
            _logger.LogError(ex, "Error during token validation");
            context.Fail("Token validation failed");
          }
        },

        OnAuthenticationFailed = context =>
        {
          var exception = context.Exception;

          // 记录详细的认证失败日志
          if (exception is SecurityTokenExpiredException)
          {
            _logger.LogInformation("JWT Token expired: {Message}", exception.Message);
            context.Response.Headers.Append("Token-Expired", "true");
          }
          else if (exception is SecurityTokenInvalidSignatureException)
          {
            _logger.LogWarning("JWT Token signature validation failed: {Message}", exception.Message);
          }
          else if (exception is SecurityTokenException)
          {
            _logger.LogWarning("JWT Token validation failed: {Message}", exception.Message);
          }
          else
          {
            _logger.LogError(exception, "JWT Authentication failed with unexpected error");
          }

          // 不抛出异常，让框架处理401响应
          return Task.CompletedTask;
        },

        OnChallenge = async context =>
        {
          // 避免默认的Challenge处理，提供自定义响应
          context.HandleResponse();

          if (!context.Response.HasStarted)
          {
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";

            var errorMessage = "Token is invalid or expired";
            var errorCode = "AUTH_FAILED";

            if (context.AuthenticateFailure is SecurityTokenExpiredException)
            {
              errorMessage = "Token has expired. Please log in again.";
              errorCode = "TOKEN_EXPIRED";
              context.Response.Headers.Append("Token-Expired", "true");
            }
            else if (context.AuthenticateFailure is SecurityTokenInvalidSignatureException)
            {
              errorMessage = "Token signature is invalid.";
              errorCode = "INVALID_SIGNATURE";
            }
            else if (context.AuthenticateFailure is SecurityTokenException)
            {
              errorMessage = "Token is invalid.";
              errorCode = "INVALID_TOKEN";
            }
            else if (context.AuthenticateFailure == null)
            {
              errorMessage = "Authorization token is required.";
              errorCode = "NO_TOKEN";
            }

            var response = System.Text.Json.JsonSerializer.Serialize(new
            {
              Success = false,
              Message = errorMessage,
              Code = errorCode
            });

            await context.Response.WriteAsync(response);
          }
        }
      };
    }
  }

  public void Configure(JwtBearerOptions options) => Configure(Options.DefaultName, options);
}