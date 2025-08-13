using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Reviews;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FarmGear_Application.Controllers;

/// <summary>
/// Review controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ReviewController : ControllerBase
{
  private readonly IReviewService _reviewService;
  private readonly ILogger<ReviewController> _logger;

  public ReviewController(
      IReviewService reviewService,
      ILogger<ReviewController> logger)
  {
    _reviewService = reviewService;
    _logger = logger;
  }

  /// <summary>
  /// Create review
  /// </summary>
  /// <param name="request">Create review request</param>
  /// <returns>Review view</returns>
  /// <remarks>
  /// Creating a review requires the following conditions:
  /// 1. User must be a farmer role
  /// 2. Order must be completed
  /// 3. Order must belong to current user
  /// 4. User cannot review the same equipment repeatedly
  /// </remarks>
  /// <response code="201">Creation successful</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="401">Unauthorized</response>
  /// <response code="403">No permission</response>
  /// <response code="404">Equipment or order does not exist</response>
  /// <response code="409">User has already reviewed this equipment</response>
  /// <response code="500">Internal server error</response>
  [HttpPost]
  [Authorize(Roles = UserRoles.Farmer)]
  [ProducesResponseType(typeof(ApiResponse<ReviewViewDto>), StatusCodes.Status201Created)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _reviewService.CreateReviewAsync(request, userId);
      return result.Success switch
      {
        true => result.Data == null
          ? StatusCode(500, new ApiResponse<ReviewViewDto> { Success = false, Message = "Created review data is null" })
          : CreatedAtAction(nameof(GetReviewById), new { id = result.Data.Id }, result),
        false => result.Message switch
        {
          "Equipment not found" => NotFound(result),
          "Order not found or does not belong to the user" => NotFound(result),
          "User has already reviewed this equipment" => Conflict(result),
          "Rating must be between 1 and 5" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while creating review");
      return StatusCode(500, new ApiResponse<ReviewViewDto>
      {
        Success = false,
        Message = "An error occurred while creating review"
      });
    }
  }

  /// <summary>
  /// 获取评论列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>分页评论列表</returns>
  /// <remarks>
  /// 查询参数说明：
  /// - EquipmentId: 按设备ID筛选
  /// - UserId: 按用户ID筛选
  /// - Rating: 按评分筛选
  /// - StartDate: 按开始日期筛选
  /// - EndDate: 按结束日期筛选
  /// - PageNumber: 页码
  /// - PageSize: 每页数量
  /// - SortBy: 排序字段
  /// - SortOrder: 排序方向
  /// </remarks>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<ReviewViewDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetReviews([FromQuery] ReviewQueryParameters parameters)
  {
    try
    {
      var result = await _reviewService.GetReviewsAsync(parameters);
      return result.Success ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving reviews");
      return StatusCode(500, new ApiResponse<PaginatedList<ReviewViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving reviews"
      });
    }
  }

  /// <summary>
  /// 获取我的评论列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>分页评论列表</returns>
  /// <remarks>
  /// 获取当前登录用户的所有评论
  /// </remarks>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("my")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<ReviewViewDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetMyReviews([FromQuery] ReviewQueryParameters parameters)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaginatedList<ReviewViewDto>>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _reviewService.GetMyReviewsAsync(parameters, userId);
      return result.Success ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving user reviews");
      return StatusCode(500, new ApiResponse<PaginatedList<ReviewViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving user reviews"
      });
    }
  }

  /// <summary>
  /// 获取评论详情
  /// </summary>
  /// <param name="id">评论ID</param>
  /// <returns>评论视图</returns>
  /// <remarks>
  /// 获取指定评论的详细信息，包括：
  /// - 评论内容
  /// - 评分
  /// - 评论时间
  /// - 评论用户信息
  /// - 设备信息
  /// - 订单信息
  /// </remarks>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="404">评论不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("{id}")]
  [ProducesResponseType(typeof(ApiResponse<ReviewViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetReviewById(string id)
  {
    try
    {
      var result = await _reviewService.GetReviewByIdAsync(id);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Review not found" => NotFound(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving review details: {ReviewId}", id);
      return StatusCode(500, new ApiResponse<ReviewViewDto>
      {
        Success = false,
        Message = "An error occurred while retrieving review details"
      });
    }
  }

  /// <summary>
  /// 更新评论
  /// </summary>
  /// <param name="id">评论ID</param>
  /// <param name="request">更新评论请求</param>
  /// <returns>更新后的评论</returns>
  /// <response code="200">更新成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">评论不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("{id}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<ReviewViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UpdateReview(string id, [FromBody] UpdateReviewRequest request)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<ReviewViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _reviewService.UpdateReviewAsync(id, request, userId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Review not found" => NotFound(result),
          "No permission to update this review" => Forbid(),
          "Rating must be between 1 and 5" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while updating review: {ReviewId}", id);
      return StatusCode(500, new ApiResponse<ReviewViewDto>
      {
        Success = false,
        Message = "An error occurred while updating review"
      });
    }
  }

  /// <summary>
  /// 删除评论
  /// </summary>
  /// <param name="id">评论ID</param>
  /// <returns>操作结果</returns>
  /// <remarks>
  /// 删除评论需要满足以下条件：
  /// 1. 用户必须是评论的作者
  /// 2. 或者用户具有管理员权限
  /// </remarks>
  /// <response code="200">删除成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">评论不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpDelete("{id}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> DeleteReview(string id)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _reviewService.DeleteReviewAsync(id, userId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Review not found" => NotFound(result),
          "No permission to delete this review" => Forbid(),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while deleting review: {ReviewId}", id);
      return StatusCode(500, new ApiResponse
      {
        Success = false,
        Message = "An error occurred while deleting review"
      });
    }
  }
}