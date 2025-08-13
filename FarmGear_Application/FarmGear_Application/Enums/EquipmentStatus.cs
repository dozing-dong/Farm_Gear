namespace FarmGear_Application.Enums;

/// <summary>
/// Equipment status enum - Refactored version
/// Status design principle: Reflect current availability of equipment, separate from order status, support independent equipment lifecycle management
/// </summary>
public enum EquipmentStatus
{
  /// <summary>
  /// Available - Equipment can be rented
  /// </summary>
  Available = 0,

  /// <summary>
  /// Rented - Equipment is currently being rented
  /// </summary>
  Rented = 1,

  /// <summary>
  /// Pending return - Rental period has ended, waiting for Provider to confirm retrieval
  /// </summary>
  PendingReturn = 2,

  /// <summary>
  /// Maintenance - Equipment is under maintenance, temporarily unavailable for rent
  /// </summary>
  Maintenance = 3,

  /// <summary>
  /// Offline - Equipment actively taken offline, not available for rent
  /// </summary>
  Offline = 4
}