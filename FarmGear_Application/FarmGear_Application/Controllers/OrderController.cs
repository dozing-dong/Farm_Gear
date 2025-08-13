using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Orders;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Controllers;

/// <summary>
/// Order controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class OrderController : ControllerBase
{
  private readonly IOrderService _orderService;
  private readonly ILogger<OrderController> _logger;

  public OrderController(IOrderService orderService, ILogger<OrderController> logger)
  {
    _orderService = orderService;
    _logger = logger;
  }

  /// <summary>
  /// Create order
  /// </summary>
  /// <param name="request">Create order request</param>
  /// <returns>Created order</returns>
  /// <response code="201">Creation successful</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="401">Unauthorized</response>
  /// <response code="404">Equipment does not exist</response>
  /// <response code="409">Time conflict</response>
  /// <response code="500">Internal server error</response>
  [HttpPost]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<OrderViewDto>), StatusCodes.Status201Created)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
  {
    try
    {
      var renterId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(renterId))
      {
        return BadRequest(new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _orderService.CreateOrderAsync(request, renterId);
      return result.Success switch
      {
        true => result.Data == null
          ? StatusCode(500, new ApiResponse<OrderViewDto> { Success = false, Message = "Created order data is null" })
          : CreatedAtAction(nameof(GetOrderById), new { id = result.Data.Id }, result),
        false => result.Message switch
        {
          "Equipment not found" => NotFound(result),
          "Equipment is not available" => Conflict(result),
          "Equipment is not available for the selected dates" => Conflict(result),
          "Start date cannot be in the past" => BadRequest(result),
          "End date must be after start date" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while creating order");
      return StatusCode(500, new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while creating order"
      });
    }
  }

  /// <summary>
  /// 获取当前用户的订单列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>当前用户的订单列表</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("my-orders")]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<OrderViewDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetMyOrders([FromQuery] OrderQueryParameters parameters)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaginatedList<OrderViewDto>>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _orderService.GetOrdersAsync(parameters, userId, isAdmin);
      return result.Success ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving orders");
      return StatusCode(500, new ApiResponse<PaginatedList<OrderViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving orders"
      });
    }
  }

  /// <summary>
  /// 获取订单详情
  /// </summary>
  /// <param name="id">订单ID</param>
  /// <returns>订单详情</returns>
  /// <response code="200">获取成功</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("{id}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<OrderViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetOrderById(string id)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _orderService.GetOrderByIdAsync(id, userId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order not found" => NotFound(result),
          "You are not authorized to view this order" => Forbid(),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving order details: {OrderId}", id);
      return StatusCode(500, new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while retrieving order details"
      });
    }
  }

  /// <summary>
  /// 更新订单状态
  /// </summary>
  /// <param name="id">订单ID</param>
  /// <param name="status">新的订单状态</param>
  /// <returns>更新后的订单</returns>
  /// <response code="200">更新成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单不存在</response>
  /// <response code="409">状态转换冲突</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("{id}/status")]
  [Authorize(Roles = $"{UserRoles.Provider},{UserRoles.Official},{UserRoles.Admin}")]
  [ProducesResponseType(typeof(ApiResponse<OrderViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] OrderStatus status)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _orderService.UpdateOrderStatusAsync(id, status, userId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order not found" => NotFound(result),
          "You are not authorized to update this order" => Forbid(),
          var msg when msg.Contains("Invalid status transition") => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while updating order status: {OrderId}", id);
      return StatusCode(500, new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while updating order status"
      });
    }
  }

  /// <summary>
  /// 取消订单
  /// </summary>
  /// <param name="id">订单ID</param>
  /// <returns>取消后的订单</returns>
  /// <response code="200">取消成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单不存在</response>
  /// <response code="409">状态冲突</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("{id}/cancel")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<OrderViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> CancelOrder(string id)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _orderService.CancelOrderAsync(id, userId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order not found" => NotFound(result),
          "You are not authorized to cancel this order" => Forbid(),
          "Order cannot be cancelled" => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while cancelling order: {OrderId}", id);
      return StatusCode(500, new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while cancelling order"
      });
    }
  }
}