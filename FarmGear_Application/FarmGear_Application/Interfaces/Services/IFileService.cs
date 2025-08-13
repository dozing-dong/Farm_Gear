using FarmGear_Application.DTOs;

namespace FarmGear_Application.Interfaces.Services;

/// <summary>
/// File service interface
/// </summary>
public interface IFileService
{
  /// <summary>
  /// Upload avatar file
  /// </summary>
  /// <param name="file">File</param>
  /// <param name="userId">User ID</param>
  /// <returns>File upload response</returns>
  Task<ApiResponse<FileUploadResponseDto>> UploadAvatarAsync(IFormFile file, string userId);

  /// <summary>
  /// Upload equipment image
  /// </summary>
  /// <param name="file">File</param>
  /// <param name="equipmentId">Equipment ID</param>
  /// <returns>File upload response</returns>
  Task<ApiResponse<FileUploadResponseDto>> UploadEquipmentImageAsync(IFormFile file, string equipmentId);

  /// <summary>
  /// Delete file
  /// </summary>
  /// <param name="fileUrl">File URL</param>
  /// <returns>Deletion result</returns>
  Task<ApiResponse> DeleteFileAsync(string fileUrl);

  /// <summary>
  /// Validate image file
  /// </summary>
  /// <param name="file">File</param>
  /// <returns>Validation result</returns>
  ApiResponse ValidateImageFile(IFormFile file);
}