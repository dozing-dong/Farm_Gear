namespace FarmGear_Application.DTOs;

/// <summary>
/// 文件上传响应 DTO
/// </summary>
public class FileUploadResponseDto
{
  /// <summary>
  /// 文件URL
  /// </summary>
  public string FileUrl { get; set; } = string.Empty;

  /// <summary>
  /// 原始文件名
  /// </summary>
  public string OriginalFileName { get; set; } = string.Empty;

  /// <summary>
  /// 文件大小（字节）
  /// </summary>
  public long FileSize { get; set; }

  /// <summary>
  /// 上传时间
  /// </summary>
  public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}