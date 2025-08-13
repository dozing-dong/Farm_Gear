using FarmGear_Application.DTOs;
using FarmGear_Application.Models;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FarmGear_Application.Controllers;

/// <summary>
/// User management controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
  private readonly UserManager<AppUser> _userManager;
  private readonly IFileService _fileService;
  private readonly ILogger<UserController> _logger;

  public UserController(
      UserManager<AppUser> userManager,
      IFileService fileService,
      ILogger<UserController> logger)
  {
    _userManager = userManager;
    _fileService = fileService;
    _logger = logger;
  }

  /// <summary>
  /// Get current logged-in user ID
  /// </summary>
  private string GetCurrentUserId()
  {
    // Due to [Authorize] protection, UserId must exist here
    return User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!;
  }

  /// <summary>
  /// Get current user details
  /// </summary>
  /// <returns>User detail information</returns>
  /// <response code="200">Successfully retrieved</response>
  /// <response code="404">User does not exist</response>
  /// <response code="500">Internal server error</response>
  [HttpGet("profile")]
  [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetUserProfile()
  {
    try
    {
      var userId = GetCurrentUserId();
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return NotFound(new ApiResponse<UserProfileDto>
        {
          Success = false,
          Message = "User not found"
        });
      }

      // 获取用户角色
      var roles = await _userManager.GetRolesAsync(user);
      var role = roles.FirstOrDefault() ?? "User";

      // 构建用户详情DTO
      var userProfile = new UserProfileDto
      {
        Id = user.Id,
        Username = user.UserName ?? string.Empty,
        FullName = user.FullName,
        Email = user.Email ?? string.Empty,
        Role = role,
        EmailConfirmed = user.EmailConfirmed,
        AvatarUrl = user.AvatarUrl,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        IsActive = user.IsActive,
        Latitude = user.Lat.HasValue ? (double?)user.Lat.Value : null,
        Longitude = user.Lng.HasValue ? (double?)user.Lng.Value : null
      };

      return Ok(new ApiResponse<UserProfileDto>
      {
        Success = true,
        Message = "User profile retrieved successfully",
        Data = userProfile
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while getting user profile for user {UserId}", GetCurrentUserId());
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<UserProfileDto>
      {
        Success = false,
        Message = "An error occurred while getting user profile"
      });
    }
  }

  /// <summary>
  /// 更新用户信息
  /// </summary>
  /// <param name="request">更新用户信息请求</param>
  /// <returns>更新后的用户详情</returns>
  /// <response code="200">更新成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="404">用户不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("profile")]
  [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateUserProfileRequest request)
  {
    try
    {
      var userId = GetCurrentUserId();
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return NotFound(new ApiResponse<UserProfileDto>
        {
          Success = false,
          Message = "User not found"
        });
      }

      // 更新用户信息
      user.FullName = request.FullName;
      user.Lat = request.Latitude.HasValue ? (decimal?)request.Latitude.Value : null;
      user.Lng = request.Longitude.HasValue ? (decimal?)request.Longitude.Value : null;

      var result = await _userManager.UpdateAsync(user);
      if (!result.Succeeded)
      {
        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
        return BadRequest(new ApiResponse<UserProfileDto>
        {
          Success = false,
          Message = $"Failed to update user profile: {errors}"
        });
      }

      _logger.LogInformation("User profile updated successfully for user {UserId}", userId);

      // 返回更新后的用户信息
      return await GetUserProfile();
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while updating user profile for user {UserId}", GetCurrentUserId());
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<UserProfileDto>
      {
        Success = false,
        Message = "An error occurred while updating user profile"
      });
    }
  }

  /// <summary>
  /// 上传用户头像
  /// </summary>
  /// <param name="file">头像文件</param>
  /// <returns>上传结果</returns>
  /// <response code="200">上传成功</response>
  /// <response code="400">文件验证失败</response>
  /// <response code="404">用户不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPost("avatar")]
  [ProducesResponseType(typeof(ApiResponse<FileUploadResponseDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
  {
    try
    {
      var userId = GetCurrentUserId();
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return NotFound(new ApiResponse<FileUploadResponseDto>
        {
          Success = false,
          Message = "User not found"
        });
      }

      // 上传新头像
      var uploadResult = await _fileService.UploadAvatarAsync(file, userId);
      if (!uploadResult.Success)
      {
        return BadRequest(uploadResult);
      }

      // 删除旧头像
      if (!string.IsNullOrEmpty(user.AvatarUrl))
      {
        await _fileService.DeleteFileAsync(user.AvatarUrl);
      }

      // 更新用户头像URL
      user.AvatarUrl = uploadResult.Data!.FileUrl;
      var updateResult = await _userManager.UpdateAsync(user);
      if (!updateResult.Succeeded)
      {
        var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
        _logger.LogError("Failed to update user avatar URL for user {UserId}: {Errors}", userId, errors);

        // 如果更新失败，删除已上传的文件
        await _fileService.DeleteFileAsync(uploadResult.Data.FileUrl);

        return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<FileUploadResponseDto>
        {
          Success = false,
          Message = "Failed to update user avatar"
        });
      }

      _logger.LogInformation("Avatar uploaded and updated successfully for user {UserId}", userId);

      return Ok(uploadResult);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while uploading avatar for user {UserId}", GetCurrentUserId());
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<FileUploadResponseDto>
      {
        Success = false,
        Message = "An error occurred while uploading avatar"
      });
    }
  }

  /// <summary>
  /// 删除用户头像
  /// </summary>
  /// <returns>删除结果</returns>
  /// <response code="200">删除成功</response>
  /// <response code="404">用户不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpDelete("avatar")]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> DeleteAvatar()
  {
    try
    {
      var userId = GetCurrentUserId();
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return NotFound(new ApiResponse
        {
          Success = false,
          Message = "User not found"
        });
      }

      // 删除头像文件
      if (!string.IsNullOrEmpty(user.AvatarUrl))
      {
        await _fileService.DeleteFileAsync(user.AvatarUrl);
      }

      // 清空用户头像URL
      user.AvatarUrl = null;
      var result = await _userManager.UpdateAsync(user);
      if (!result.Succeeded)
      {
        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
        return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
        {
          Success = false,
          Message = $"Failed to update user profile: {errors}"
        });
      }

      _logger.LogInformation("Avatar deleted successfully for user {UserId}", userId);

      return Ok(new ApiResponse
      {
        Success = true,
        Message = "Avatar deleted successfully"
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while deleting avatar for user {UserId}", GetCurrentUserId());
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse
      {
        Success = false,
        Message = "An error occurred while deleting avatar"
      });
    }
  }
}