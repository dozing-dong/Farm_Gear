namespace FarmGear_Application.DTOs;

/// <summary>
/// Generic API response DTO
/// </summary>
public class ApiResponse
{
  /// <summary>
  /// Whether successful
  /// </summary>
  public bool Success { get; set; }

  /// <summary>
  /// Message
  /// </summary>
  public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Generic API response DTO with data
/// </summary>
/// <typeparam name="T">Data type</typeparam>
public class ApiResponse<T> : ApiResponse
{
  /// <summary>
  /// Response data
  /// </summary>
  public T? Data { get; set; }
}