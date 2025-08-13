namespace FarmGear_Application.DTOs.Reviews;

/// <summary>
/// Review view DTO
/// </summary>
public class ReviewViewDto
{
  /// <summary>
  /// Review ID
  /// </summary>
  public string Id { get; set; } = string.Empty;

  /// <summary>
  /// Equipment ID
  /// </summary>
  public string EquipmentId { get; set; } = string.Empty;

  /// <summary>
  /// Equipment name
  /// </summary>
  public string EquipmentName { get; set; } = string.Empty;

  /// <summary>
  /// Order ID
  /// </summary>
  public string OrderId { get; set; } = string.Empty;

  /// <summary>
  /// User ID
  /// </summary>
  public string UserId { get; set; } = string.Empty;

  /// <summary>
  /// Username
  /// </summary>
  public string UserName { get; set; } = string.Empty;

  /// <summary>
  /// Rating (1-5)
  /// </summary>
  public int Rating { get; set; }

  /// <summary>
  /// Review content
  /// </summary>
  public string? Content { get; set; }

  /// <summary>
  /// Creation time
  /// </summary>
  public DateTime CreatedAt { get; set; }

  /// <summary>
  /// Update time
  /// </summary>
  public DateTime UpdatedAt { get; set; }
}