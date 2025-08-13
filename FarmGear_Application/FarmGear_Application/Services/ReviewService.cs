using FarmGear_Application.Data;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Reviews;
using FarmGear_Application.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FarmGear_Application.Enums;
using FarmGear_Application.Interfaces.Services;

namespace FarmGear_Application.Services;

/// <summary>
/// Review service implementation
/// </summary>
public class ReviewService : IReviewService
{
  private readonly ApplicationDbContext _context;
  private readonly UserManager<AppUser> _userManager;
  private readonly ILogger<ReviewService> _logger;

  public ReviewService(
      ApplicationDbContext context,
      UserManager<AppUser> userManager,
      ILogger<ReviewService> logger)
  {
    _context = context;
    _userManager = userManager;
    _logger = logger;
  }

  /// <summary>
  /// Create review, requires validation of user permissions and order status
  /// </summary>
  /// <param name="request">Create review request</param>
  /// <param name="userId">User ID</param>
  /// <returns>Review view</returns>
  public async Task<ApiResponse<ReviewViewDto>> CreateReviewAsync(CreateReviewRequest request, string userId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if user exists
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "User does not exist"
        };
      }

      // 验证设备是否存在
      var equipment = await _context.Equipment
          .FirstOrDefaultAsync(e => e.Id == request.EquipmentId);
      if (equipment == null)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Equipment not found"
        };
      }

      // 验证订单是否存在且属于该用户
      if (!await IsOrderCompletedAndBelongsToUserAsync(request.OrderId, userId))
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Order not found or does not belong to the user"
        };
      }

      // 验证评分范围
      if (request.Rating < 1 || request.Rating > 5)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Rating must be between 1 and 5"
        };
      }

      // 检查用户是否已评论过该设备
      if (await HasUserReviewedEquipmentAsync(request.EquipmentId, userId))
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "User has already reviewed this equipment"
        };
      }

      // 创建评论
      var review = new Review
      {
        EquipmentId = request.EquipmentId,
        OrderId = request.OrderId,
        UserId = userId,
        Rating = request.Rating,
        Content = request.Content,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
      };

      _context.Reviews.Add(review);

      // 更新设备平均评分
      var reviews = await _context.Reviews
          .Where(r => r.EquipmentId == request.EquipmentId)
          .ToListAsync();
      reviews.Add(review); // 添加新创建的评论

      var averageRating = reviews.Average(r => r.Rating);
      equipment.AverageRating = (decimal)averageRating;

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<ReviewViewDto>
      {
        Success = true,
        Message = "Review created successfully",
        Data = await MapToViewDtoAsync(review)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error creating review for equipment {EquipmentId}", request.EquipmentId);
      return new ApiResponse<ReviewViewDto>
      {
        Success = false,
        Message = "An error occurred while creating the review"
      };
    }
  }

  /// <summary>
  /// 获取评论列表，支持分页和筛选
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>分页评论列表</returns>
  public async Task<ApiResponse<PaginatedList<ReviewViewDto>>> GetReviewsAsync(ReviewQueryParameters parameters)
  {
    try
    {
      var query = _context.Reviews
          .Include(r => r.Equipment)
          .Include(r => r.User)
          .AsQueryable();

      // 应用筛选条件
      query = ApplyFilters(query, parameters);

      // 应用排序
      query = ApplySorting(query, parameters);

      // 获取分页数据
      var paginatedList = await PaginatedList<Review>.CreateAsync(
          query,
          parameters.PageNumber,
          parameters.PageSize);

      // 转换为视图 DTO
      var items = await Task.WhenAll(
          paginatedList.Items.Select(MapToViewDtoAsync));

      return new ApiResponse<PaginatedList<ReviewViewDto>>
      {
        Success = true,
        Data = new PaginatedList<ReviewViewDto>(
            items.ToList(),
            paginatedList.TotalCount,
            paginatedList.PageNumber,
            paginatedList.PageSize)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error retrieving reviews with parameters {@Parameters}", parameters);
      return new ApiResponse<PaginatedList<ReviewViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving reviews"
      };
    }
  }

  /// <summary>
  /// 获取用户的评论列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <param name="userId">用户ID</param>
  /// <returns>分页评论列表</returns>
  public async Task<ApiResponse<PaginatedList<ReviewViewDto>>> GetMyReviewsAsync(
      ReviewQueryParameters parameters,
      string userId)
  {
    try
    {
      var query = _context.Reviews
          .Include(r => r.Equipment)
          .Include(r => r.User)
          .Where(r => r.UserId == userId)
          .AsQueryable();

      // 应用筛选条件
      query = ApplyFilters(query, parameters);

      // 应用排序
      query = ApplySorting(query, parameters);

      // 获取分页数据
      var paginatedList = await PaginatedList<Review>.CreateAsync(
          query,
          parameters.PageNumber,
          parameters.PageSize);

      // 转换为视图 DTO
      var items = await Task.WhenAll(
          paginatedList.Items.Select(MapToViewDtoAsync));

      return new ApiResponse<PaginatedList<ReviewViewDto>>
      {
        Success = true,
        Data = new PaginatedList<ReviewViewDto>(
            items.ToList(),
            paginatedList.TotalCount,
            paginatedList.PageNumber,
            paginatedList.PageSize)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting reviews for user {UserId}", userId);
      return new ApiResponse<PaginatedList<ReviewViewDto>>
      {
        Success = false,
        Message = "An error occurred while getting user reviews"
      };
    }
  }

  /// <summary>
  /// 根据ID获取评论详情
  /// </summary>
  /// <param name="id">评论ID</param>
  /// <returns>评论视图</returns>
  public async Task<ApiResponse<ReviewViewDto>> GetReviewByIdAsync(string id)
  {
    try
    {
      var review = await _context.Reviews
          .Include(r => r.Equipment)
          .Include(r => r.User)
          .FirstOrDefaultAsync(r => r.Id == id);

      if (review == null)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Review not found"
        };
      }

      return new ApiResponse<ReviewViewDto>
      {
        Success = true,
        Data = await MapToViewDtoAsync(review)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting review {ReviewId}", id);
      return new ApiResponse<ReviewViewDto>
      {
        Success = false,
        Message = "An error occurred while getting the review"
      };
    }
  }

  /// <summary>
  /// 更新评论内容和评分
  /// </summary>
  /// <param name="id">评论ID</param>
  /// <param name="request">更新评论请求</param>
  /// <param name="userId">用户ID</param>
  /// <returns>更新后的评论</returns>
  public async Task<ApiResponse<ReviewViewDto>> UpdateReviewAsync(string id, UpdateReviewRequest request, string userId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // 检查评论是否存在
      var review = await _context.Reviews
          .Include(r => r.Equipment)
          .Include(r => r.User)
          .FirstOrDefaultAsync(r => r.Id == id);

      if (review == null)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Review not found"
        };
      }

      // 检查权限：只有评论的作者可以更新
      if (review.UserId != userId)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "No permission to update this review"
        };
      }

      // 验证评分范围
      if (request.Rating < 1 || request.Rating > 5)
      {
        return new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Rating must be between 1 and 5"
        };
      }

      // 更新评论信息
      var oldRating = review.Rating;
      review.Rating = request.Rating;
      review.Content = request.Content;
      review.UpdatedAt = DateTime.UtcNow;

      // 如果评分发生变化，需要更新设备平均评分
      if (oldRating != request.Rating && review.Equipment != null)
      {
        var averageRating = await _context.Reviews
            .Where(r => r.EquipmentId == review.EquipmentId)
            .AverageAsync(r => r.Rating);

        review.Equipment.AverageRating = (decimal)averageRating;
      }

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<ReviewViewDto>
      {
        Success = true,
        Message = "Review updated successfully",
        Data = await MapToViewDtoAsync(review)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error updating review {ReviewId}", id);
      return new ApiResponse<ReviewViewDto>
      {
        Success = false,
        Message = "An error occurred while updating the review"
      };
    }
  }

  /// <summary>
  /// 删除评论，需要验证权限
  /// </summary>
  /// <param name="id">评论ID</param>
  /// <param name="userId">用户ID</param>
  /// <param name="isAdmin">是否为管理员</param>
  /// <returns>操作结果</returns>
  public async Task<ApiResponse> DeleteReviewAsync(string id, string userId, bool isAdmin)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // 获取评论信息
      var review = await _context.Reviews
          .Include(r => r.Equipment)
          .FirstOrDefaultAsync(r => r.Id == id);

      if (review == null)
      {
        return new ApiResponse
        {
          Success = false,
          Message = "Review not found"
        };
      }

      // 检查权限：只有评论作者或管理员可以删除
      if (!isAdmin && review.UserId != userId)
      {
        return new ApiResponse
        {
          Success = false,
          Message = "No permission to delete this review"
        };
      }

      // 删除评论
      _context.Reviews.Remove(review);

      // 更新设备平均评分
      if (review.Equipment != null)
      {
        var remainingReviews = await _context.Reviews
            .Where(r => r.EquipmentId == review.EquipmentId && r.Id != id)
            .ToListAsync();

        if (remainingReviews.Any())
        {
          var averageRating = remainingReviews.Average(r => r.Rating);
          review.Equipment.AverageRating = (decimal)averageRating;
        }
        else
        {
          review.Equipment.AverageRating = 0; // 没有评论时设为0
        }
      }

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse
      {
        Success = true,
        Message = "Review deleted successfully"
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error deleting review {ReviewId}", id);
      return new ApiResponse
      {
        Success = false,
        Message = "An error occurred while deleting the review"
      };
    }
  }

  /// <summary>
  /// 检查用户是否已评论过设备
  /// </summary>
  /// <param name="equipmentId">设备ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>是否已评论</returns>
  public async Task<bool> HasUserReviewedEquipmentAsync(string equipmentId, string userId)
  {
    try
    {
      return await _context.Reviews
          .AnyAsync(r => r.EquipmentId == equipmentId && r.UserId == userId);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error checking if user {UserId} has reviewed equipment {EquipmentId}", userId, equipmentId);
      return false;
    }
  }

  /// <summary>
  /// 检查订单是否已完成且属于用户
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>是否有效</returns>
  public async Task<bool> IsOrderCompletedAndBelongsToUserAsync(string orderId, string userId)
  {
    try
    {
      var order = await _context.Orders
          .FirstOrDefaultAsync(o => o.Id == orderId);

      return order != null &&
             order.RenterId == userId &&
             order.Status == OrderStatus.Completed;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error checking order {OrderId} status for user {UserId}", orderId, userId);
      return false;
    }
  }

  /// <summary>
  /// 应用筛选条件到查询
  /// </summary>
  /// <param name="query">查询对象</param>
  /// <param name="parameters">查询参数</param>
  /// <returns>应用筛选后的查询</returns>
  private static IQueryable<Review> ApplyFilters(IQueryable<Review> query, ReviewQueryParameters parameters)
  {
    if (!string.IsNullOrEmpty(parameters.EquipmentId))
    {
      query = query.Where(r => r.EquipmentId == parameters.EquipmentId);
    }

    if (!string.IsNullOrEmpty(parameters.UserId))
    {
      query = query.Where(r => r.UserId == parameters.UserId);
    }

    if (parameters.MinRating.HasValue)
    {
      query = query.Where(r => r.Rating >= parameters.MinRating.Value);
    }

    if (parameters.MaxRating.HasValue)
    {
      query = query.Where(r => r.Rating <= parameters.MaxRating.Value);
    }

    if (parameters.StartDate.HasValue)
    {
      query = query.Where(r => r.CreatedAt >= parameters.StartDate.Value);
    }

    if (parameters.EndDate.HasValue)
    {
      query = query.Where(r => r.CreatedAt <= parameters.EndDate.Value);
    }

    return query;
  }

  /// <summary>
  /// 应用排序到查询
  /// </summary>
  /// <param name="query">查询对象</param>
  /// <param name="parameters">查询参数</param>
  /// <returns>应用排序后的查询</returns>
  private static IQueryable<Review> ApplySorting(IQueryable<Review> query, ReviewQueryParameters parameters)
  {
    return parameters.SortBy?.ToLower() switch
    {
      "rating" => parameters.IsAscending
          ? query.OrderBy(r => r.Rating)
          : query.OrderByDescending(r => r.Rating),
      "createdat" => parameters.IsAscending
          ? query.OrderBy(r => r.CreatedAt)
          : query.OrderByDescending(r => r.CreatedAt),
      "updatedat" => parameters.IsAscending
          ? query.OrderBy(r => r.UpdatedAt)
          : query.OrderByDescending(r => r.UpdatedAt),
      _ => query.OrderByDescending(r => r.CreatedAt)
    };
  }

  /// <summary>
  /// 将评论实体映射为视图DTO
  /// </summary>
  /// <param name="review">评论实体</param>
  /// <returns>评论视图DTO</returns>
  private async Task<ReviewViewDto> MapToViewDtoAsync(Review review)
  {
    var user = await _userManager.FindByIdAsync(review.UserId);

    return new ReviewViewDto
    {
      Id = review.Id,
      EquipmentId = review.EquipmentId,
      EquipmentName = review.Equipment?.Name ?? string.Empty,
      OrderId = review.OrderId,
      UserId = review.UserId,
      UserName = user?.UserName ?? string.Empty,
      Rating = review.Rating,
      Content = review.Content,
      CreatedAt = review.CreatedAt,
      UpdatedAt = review.UpdatedAt
    };
  }
}