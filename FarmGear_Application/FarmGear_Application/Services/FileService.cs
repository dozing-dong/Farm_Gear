using FarmGear_Application.DTOs;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Configuration;
using Microsoft.Extensions.Options;

namespace FarmGear_Application.Services;

/// <summary>
/// File service implementation
/// </summary>
public class FileService : IFileService
{
  private readonly ILogger<FileService> _logger;
  private readonly IWebHostEnvironment _environment;
  private readonly ApplicationSettings _appSettings;
  private readonly FileStorageSettings _fileSettings;

  public FileService(
      ILogger<FileService> logger,
      IWebHostEnvironment environment,
      IOptions<ApplicationSettings> appSettings)
  {
    _logger = logger;
    _environment = environment;
    _appSettings = appSettings.Value;
    _fileSettings = _appSettings.FileStorage;
  }

  // 🔧 Use values from configuration, remove hard coding
  private long MaxFileSizeBytes => _fileSettings.MaxFileSizeMB * 1024 * 1024;
  private string[] AllowedImageExtensions => _fileSettings.AllowedImageExtensions;
  private string[] AllowedImageMimeTypes => _fileSettings.AllowedImageMimeTypes;

  /// <summary>
  /// Upload avatar file
  /// </summary>
  public async Task<ApiResponse<FileUploadResponseDto>> UploadAvatarAsync(IFormFile file, string userId)
  {
    try
    {
      // Validate file
      var validationResult = ValidateImageFile(file);
      if (!validationResult.Success)
      {
        return new ApiResponse<FileUploadResponseDto>
        {
          Success = false,
          Message = validationResult.Message
        };
      }

      // 创建文件存储目录
      var uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "avatars");
      if (!Directory.Exists(uploadsPath))
      {
        Directory.CreateDirectory(uploadsPath);
      }

      // 生成唯一文件名
      var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
      var uniqueFileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
      var filePath = Path.Combine(uploadsPath, uniqueFileName);

      // 保存文件
      using (var stream = new FileStream(filePath, FileMode.Create))
      {
        await file.CopyToAsync(stream);
      }

      // 生成文件URL（为云存储迁移做准备）
      var baseUrl = _fileSettings.BaseUrl;
      var fileUrl = $"{baseUrl}/{uniqueFileName}";

      _logger.LogInformation("Avatar uploaded successfully for user {UserId}, file: {FileName}", userId, uniqueFileName);

      return new ApiResponse<FileUploadResponseDto>
      {
        Success = true,
        Message = "Avatar uploaded successfully",
        Data = new FileUploadResponseDto
        {
          FileUrl = fileUrl,
          OriginalFileName = file.FileName,
          FileSize = file.Length,
          UploadedAt = DateTime.UtcNow
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
      return new ApiResponse<FileUploadResponseDto>
      {
        Success = false,
        Message = "Failed to upload avatar. Please try again."
      };
    }
  }

  /// <summary>
  /// 上传设备图片
  /// </summary>
  public async Task<ApiResponse<FileUploadResponseDto>> UploadEquipmentImageAsync(IFormFile file, string equipmentId)
  {
    try
    {
      // Validate file
      var validationResult = ValidateImageFile(file);
      if (!validationResult.Success)
      {
        return new ApiResponse<FileUploadResponseDto>
        {
          Success = false,
          Message = validationResult.Message
        };
      }

      // 创建文件存储目录
      var uploadsPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "equipment");
      if (!Directory.Exists(uploadsPath))
      {
        Directory.CreateDirectory(uploadsPath);
      }

      // 生成唯一文件名
      var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
      var uniqueFileName = $"{equipmentId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{fileExtension}";
      var filePath = Path.Combine(uploadsPath, uniqueFileName);

      // 保存文件
      using (var stream = new FileStream(filePath, FileMode.Create))
      {
        await file.CopyToAsync(stream);
      }

      // 生成文件URL
      var baseUrl = _fileSettings.BaseUrl.TrimEnd('/');
      var fileUrl = $"{baseUrl}/equipment/{uniqueFileName}";

      _logger.LogInformation("Equipment image uploaded successfully for equipment {EquipmentId}, file: {FileName}", equipmentId, uniqueFileName);

      return new ApiResponse<FileUploadResponseDto>
      {
        Success = true,
        Message = "Equipment image uploaded successfully",
        Data = new FileUploadResponseDto
        {
          FileUrl = fileUrl,
          OriginalFileName = file.FileName,
          FileSize = file.Length,
          UploadedAt = DateTime.UtcNow
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error uploading equipment image for equipment {EquipmentId}", equipmentId);
      return new ApiResponse<FileUploadResponseDto>
      {
        Success = false,
        Message = "Failed to upload equipment image. Please try again."
      };
    }
  }

  /// <summary>
  /// 删除文件
  /// </summary>
  public Task<ApiResponse> DeleteFileAsync(string fileUrl)
  {
    try
    {
      if (string.IsNullOrEmpty(fileUrl))
      {
        return Task.FromResult(new ApiResponse { Success = true, Message = "No file to delete" });
      }

      // 从URL提取文件路径
      var fileName = Path.GetFileName(new Uri(fileUrl).LocalPath);
      var filePath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "avatars", fileName);

      if (File.Exists(filePath))
      {
        File.Delete(filePath);
        _logger.LogInformation("File deleted successfully: {FileName}", fileName);
      }

      return Task.FromResult(new ApiResponse
      {
        Success = true,
        Message = "File deleted successfully"
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error deleting file: {FileUrl}", fileUrl);
      return Task.FromResult(new ApiResponse
      {
        Success = false,
        Message = "Failed to delete file"
      });
    }
  }

  /// <summary>
  /// 验证图片文件
  /// </summary>
  public ApiResponse ValidateImageFile(IFormFile file)
  {
    if (file == null || file.Length == 0)
    {
      return new ApiResponse
      {
        Success = false,
        Message = "File is required"
      };
    }

    // 检查文件大小
    if (file.Length > MaxFileSizeBytes)
    {
      return new ApiResponse
      {
        Success = false,
        Message = $"File size must not exceed {_fileSettings.MaxFileSizeMB}MB"
      };
    }

    // 检查文件扩展名
    var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!AllowedImageExtensions.Contains(fileExtension))
    {
      return new ApiResponse
      {
        Success = false,
        Message = $"Only image files are allowed: {string.Join(", ", AllowedImageExtensions)}"
      };
    }

    // 检查MIME类型
    if (!AllowedImageMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
    {
      return new ApiResponse
      {
        Success = false,
        Message = "Invalid file type. Only image files are allowed."
      };
    }

    return new ApiResponse
    {
      Success = true,
      Message = "File validation passed"
    };
  }

  /// <summary>
  /// 获取基础URL
  /// </summary>
  private string GetBaseUrl()
  {
    return _fileSettings.BaseUrl;
  }
}