using FarmGear_Application.DTOs;

namespace FarmGear_Application.Interfaces.Services;

/// <summary>
/// Order expiration service interface
/// </summary>
public interface IOrderExpirationService
{
  /// <summary>
  /// Check and complete all expired orders
  /// </summary>
  /// <returns>Processing result</returns>
  Task<ApiResponse<OrderExpirationResult>> CheckAndCompleteExpiredOrdersAsync();
}

/// <summary>
/// Order expiration processing result
/// </summary>
public class OrderExpirationResult
{
  /// <summary>
  /// Number of processed expired orders
  /// </summary>
  public int ProcessedOrderCount { get; set; }

  /// <summary>
  /// Processing timestamp
  /// </summary>
  public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}