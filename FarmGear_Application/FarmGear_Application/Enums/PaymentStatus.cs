namespace FarmGear_Application.Enums;

/// <summary>
/// Payment status enum
/// </summary>
public enum PaymentStatus
{
  /// <summary>
  /// Pending payment
  /// </summary>
  Pending,

  /// <summary>
  /// Payment successful
  /// </summary>
  Paid,

  /// <summary>
  /// Payment failed
  /// </summary>
  Failed,

  /// <summary>
  /// Cancelled
  /// </summary>
  Cancelled
}