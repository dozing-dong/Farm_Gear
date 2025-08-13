using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Reviews;

namespace FarmGear_Application.Interfaces.Services;

/// <summary>
/// Review service interface
/// </summary>
public interface IReviewService
{
  /// <summary>
  /// Create review
  /// </summary>
  /// <param name="request">Create review request</param>
  /// <param name="userId">User ID</param>
  /// <returns>Review view</returns>
  Task<ApiResponse<ReviewViewDto>> CreateReviewAsync(CreateReviewRequest request, string userId);

  /// <summary>
  /// Get review list
  /// </summary>
  /// <param name="parameters">Query parameters</param>
  /// <returns>Paginated review list</returns>
  Task<ApiResponse<PaginatedList<ReviewViewDto>>> GetReviewsAsync(ReviewQueryParameters parameters);

  /// <summary>
  /// Get my review list
  /// </summary>
  /// <param name="parameters">Query parameters</param>
  /// <param name="userId">User ID</param>
  /// <returns>Paginated review list</returns>
  Task<ApiResponse<PaginatedList<ReviewViewDto>>> GetMyReviewsAsync(ReviewQueryParameters parameters, string userId);

  /// <summary>
  /// Get review details
  /// </summary>
  /// <param name="id">Review ID</param>
  /// <returns>Review view</returns>
  Task<ApiResponse<ReviewViewDto>> GetReviewByIdAsync(string id);

  /// <summary>
  /// Update review
  /// </summary>
  /// <param name="id">Review ID</param>
  /// <param name="request">Update review request</param>
  /// <param name="userId">User ID</param>
  /// <returns>Updated review</returns>
  Task<ApiResponse<ReviewViewDto>> UpdateReviewAsync(string id, UpdateReviewRequest request, string userId);

  /// <summary>
  /// Delete review
  /// </summary>
  /// <param name="id">Review ID</param>
  /// <param name="userId">User ID</param>
  /// <param name="isAdmin">Whether it's administrator</param>
  /// <returns>Operation result</returns>
  Task<ApiResponse> DeleteReviewAsync(string id, string userId, bool isAdmin);

  /// <summary>
  /// Check if user has already reviewed equipment
  /// </summary>
  /// <param name="equipmentId">Equipment ID</param>
  /// <param name="userId">User ID</param>
  /// <returns>Whether already reviewed</returns>
  Task<bool> HasUserReviewedEquipmentAsync(string equipmentId, string userId);

  /// <summary>
  /// Check if order is completed and belongs to user
  /// </summary>
  /// <param name="orderId">Order ID</param>
  /// <param name="userId">User ID</param>
  /// <returns>Whether valid</returns>
  Task<bool> IsOrderCompletedAndBelongsToUserAsync(string orderId, string userId);
}