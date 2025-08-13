namespace FarmGear_Application.Enums;

/// <summary>
/// Order status enum - Refactored version
/// Status design principle: Reflect the complete lifecycle of rental contract, separate from equipment status
/// </summary>
public enum OrderStatus
{
  /// <summary>
  /// Pending - Farmer submitted application, waiting for Provider response
  /// </summary>
  Pending = 0,

  /// <summary>
  /// Accepted - Provider approved application, waiting for payment and rental period to start
  /// </summary>
  Accepted = 1,

  /// <summary>
  /// In progress - Payment completed and rental period has started, equipment is in use
  /// </summary>
  InProgress = 2,

  /// <summary>
  /// Completed - Rental period ended, order completed (final status, used for review permissions)
  /// </summary>
  Completed = 3,

  /// <summary>
  /// Rejected - Provider rejected application
  /// </summary>
  Rejected = 4,

  /// <summary>
  /// Cancelled - Order was cancelled (before starting)
  /// </summary>
  Cancelled = 5
}