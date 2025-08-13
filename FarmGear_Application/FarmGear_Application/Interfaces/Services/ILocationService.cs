using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Location;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Interfaces.Services;

/// <summary>
/// Location service interface
/// </summary>
public interface ILocationService
{
  /// <summary>
  /// Get nearby equipment
  /// </summary>
  /// <param name="parameters">Query parameters</param>
  /// <returns>Paginated list of equipment location information</returns>
  Task<ApiResponse<PaginatedList<EquipmentLocationDto>>> GetNearbyEquipmentAsync(LocationQueryParameters parameters);

  /// <summary>
  /// Get equipment distribution heatmap data
  /// </summary>
  /// <param name="southWestLat">Southwest corner latitude</param>
  /// <param name="southWestLng">Southwest corner longitude</param>
  /// <param name="northEastLat">Northeast corner latitude</param>
  /// <param name="northEastLng">Northeast corner longitude</param>
  /// <param name="status">Equipment status (optional)</param>
  /// <param name="equipmentType">Equipment type (optional)</param>
  /// <returns>Heatmap point data list</returns>
  Task<ApiResponse<List<HeatmapPoint>>> GetEquipmentHeatmapAsync(
      double southWestLat,
      double southWestLng,
      double northEastLat,
      double northEastLng,
      EquipmentStatus? status = null,
      string? equipmentType = null);

  /// <summary>
  /// Get provider distribution
  /// </summary>
  /// <param name="southWestLat">Southwest corner latitude</param>
  /// <param name="southWestLng">Southwest corner longitude</param>
  /// <param name="northEastLat">Northeast corner latitude</param>
  /// <param name="northEastLng">Northeast corner longitude</param>
  /// <param name="minEquipmentCount">Minimum equipment count (optional)</param>
  /// <returns>Provider location information list</returns>
  Task<ApiResponse<List<ProviderLocationDto>>> GetProviderDistributionAsync(
      double southWestLat,
      double southWestLng,
      double northEastLat,
      double northEastLng,
      int? minEquipmentCount = null);

  /// <summary>
  /// Update user location
  /// </summary>
  /// <param name="userId">User ID</param>
  /// <param name="request">Location information</param>
  /// <returns>Updated location information</returns>
  Task<ApiResponse<LocationViewDto>> UpdateUserLocationAsync(string userId, UpdateLocationRequest request);

  /// <summary>
  /// Get user location
  /// </summary>
  /// <param name="userId">User ID</param>
  /// <returns>User location information</returns>
  Task<ApiResponse<LocationViewDto>> GetUserLocationAsync(string userId);
}