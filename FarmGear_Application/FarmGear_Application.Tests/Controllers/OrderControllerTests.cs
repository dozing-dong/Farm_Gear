using System.Security.Claims;
using FarmGear_Application.Controllers;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Orders;
using FarmGear_Application.Models;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Enums;
using FarmGear_Application.Constants;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FarmGear_Application.Tests.Controllers;

/// <summary>
/// 订单控制器的单元测试类
/// 用于测试订单管理API的各个功能点，包括：
/// - 订单的CRUD操作
/// - 用户权限验证
/// - 错误处理
/// - 业务逻辑验证
/// </summary>
public class OrderControllerTests
{
  /// <summary>
  /// 模拟的订单服务接口，用于模拟后端服务的行为
  /// </summary>
  private readonly Mock<IOrderService> _mockOrderService;

  /// <summary>
  /// 模拟的日志记录器，用于记录控制器操作日志
  /// </summary>
  private readonly Mock<ILogger<OrderController>> _mockLogger;

  /// <summary>
  /// 被测试的订单控制器实例
  /// </summary>
  private readonly OrderController _controller;

  /// <summary>
  /// 构造函数，初始化测试环境
  /// 创建模拟对象和控制器实例
  /// </summary>
  public OrderControllerTests()
  {
    _mockOrderService = new Mock<IOrderService>();
    _mockLogger = new Mock<ILogger<OrderController>>();
    _controller = new OrderController(_mockOrderService.Object, _mockLogger.Object);
  }

  /// <summary>
  /// 设置用户上下文，模拟用户认证状态
  /// </summary>
  /// <param name="userId">用户ID，默认为"test-user-id"</param>
  /// <param name="role">用户角色，默认为Farmer</param>
  private void SetupUserContext(string userId = "test-user-id", string role = UserRoles.Farmer)
  {
    var claims = new List<Claim>
        {
            new Claim("sub", userId),
            new Claim(ClaimTypes.Role, role)
        };
    var identity = new ClaimsIdentity(claims, "test");
    var principal = new ClaimsPrincipal(identity);

    _controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal }
    };
  }

  #region CreateOrder Tests

  /// <summary>
  /// 测试创建订单 - 有效请求场景
  /// 验证：
  /// - 返回201 Created状态码
  /// - 返回正确的订单信息
  /// - 返回正确的操作消息
  /// - 返回正确的Action名称
  /// </summary>
  [Fact]
  public async Task CreateOrder_ValidRequest_ReturnsCreatedResult()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var request = new CreateOrderRequest
    {
      EquipmentId = "equipment-id",
      StartDate = DateTime.UtcNow.AddDays(1),
      EndDate = DateTime.UtcNow.AddDays(3)
    };

    var orderView = new OrderViewDto
    {
      Id = "order-id",
      EquipmentId = request.EquipmentId,
      EquipmentName = "Test Equipment",
      RenterId = userId,
      RenterName = "Test User",
      StartDate = request.StartDate,
      EndDate = request.EndDate,
      TotalAmount = 200.00m,
      Status = OrderStatus.Pending,
      CreatedAt = DateTime.UtcNow
    };

    var successResponse = new ApiResponse<OrderViewDto>
    {
      Success = true,
      Data = orderView,
      Message = "Order created successfully"
    };

    _mockOrderService
        .Setup(x => x.CreateOrderAsync(request, userId))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<CreatedAtActionResult>();
    var createdResult = result as CreatedAtActionResult;
    createdResult!.Value.Should().BeEquivalentTo(successResponse);
    createdResult.ActionName.Should().Be(nameof(OrderController.GetOrderById));
  }

  /// <summary>
  /// 测试创建订单 - 无用户声明场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回失败消息
  /// - 提示无法获取用户信息
  /// </summary>
  [Fact]
  public async Task CreateOrder_NoUserClaim_ReturnsBadRequest()
  {
    // Arrange
    SetupUserContext("", UserRoles.Farmer); // Empty user ID
    var request = new CreateOrderRequest();

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
    var badRequestResult = result as BadRequestObjectResult;
    var response = badRequestResult!.Value as ApiResponse<OrderViewDto>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("Failed to get user information");
  }

  /// <summary>
  /// 测试创建订单 - 设备不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回设备不存在的错误消息
  /// </summary>
  [Fact]
  public async Task CreateOrder_EquipmentNotFound_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new CreateOrderRequest { EquipmentId = "non-existent-id" };

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Equipment not found"
    };

    _mockOrderService
        .Setup(x => x.CreateOrderAsync(request, userId))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试创建订单 - 设备不可用场景
  /// 验证：
  /// - 返回409 Conflict状态码
  /// - 返回设备不可用的错误消息
  /// </summary>
  [Fact]
  public async Task CreateOrder_EquipmentNotAvailable_ReturnsConflict()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new CreateOrderRequest { EquipmentId = "equipment-id" };

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Equipment is not available"
    };

    _mockOrderService
        .Setup(x => x.CreateOrderAsync(request, userId))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<ConflictObjectResult>();
  }

  /// <summary>
  /// 测试创建订单 - 时间冲突场景
  /// 验证：
  /// - 返回409 Conflict状态码
  /// - 返回时间冲突的错误消息
  /// </summary>
  [Fact]
  public async Task CreateOrder_TimeConflict_ReturnsConflict()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new CreateOrderRequest { EquipmentId = "equipment-id" };

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Equipment is not available for the selected dates"
    };

    _mockOrderService
        .Setup(x => x.CreateOrderAsync(request, userId))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<ConflictObjectResult>();
  }

  /// <summary>
  /// 测试创建订单 - 参数验证错误场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回参数验证错误消息
  /// </summary>
  [Fact]
  public async Task CreateOrder_InvalidDate_ReturnsBadRequest()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new CreateOrderRequest { EquipmentId = "equipment-id" };

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Start date cannot be in the past"
    };

    _mockOrderService
        .Setup(x => x.CreateOrderAsync(request, userId))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  #endregion

  #region GetOrders Tests

  /// <summary>
  /// 测试获取订单列表 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回分页订单列表
  /// - 返回正确的订单信息
  /// </summary>
  [Fact]
  public async Task GetOrders_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var parameters = new OrderQueryParameters
    {
      PageNumber = 1,
      PageSize = 10
    };

    var orders = new List<OrderViewDto>
        {
            new OrderViewDto
            {
                Id = "order-1",
                EquipmentId = "equipment-1",
                EquipmentName = "Test Equipment 1",
                RenterId = userId,
                RenterName = "Test User",
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow
            }
        };

    var paginatedList = new PaginatedList<OrderViewDto>(orders, 1, 1, 10);
    var successResponse = new ApiResponse<PaginatedList<OrderViewDto>>
    {
      Success = true,
      Data = paginatedList
    };

    _mockOrderService
        .Setup(x => x.GetOrdersAsync(parameters, userId, false))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetOrders(parameters);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取订单列表 - 无用户声明场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回失败消息
  /// </summary>
  [Fact]
  public async Task GetOrders_NoUserClaim_ReturnsBadRequest()
  {
    // Arrange
    SetupUserContext("", "Customer");
    var parameters = new OrderQueryParameters();

    // Act
    var result = await _controller.GetOrders(parameters);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
    var badRequestResult = result as BadRequestObjectResult;
    var response = badRequestResult!.Value as ApiResponse<PaginatedList<OrderViewDto>>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("Failed to get user information");
  }

  /// <summary>
  /// 测试获取订单列表 - 管理员用户场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确传递管理员标识
  /// </summary>
  [Fact]
  public async Task GetOrders_AdminUser_CallsServiceWithAdminFlag()
  {
    // Arrange
    var userId = "admin-user-id";
    SetupUserContext(userId, "Admin");

    var parameters = new OrderQueryParameters();
    var successResponse = new ApiResponse<PaginatedList<OrderViewDto>>
    {
      Success = true,
      Data = new PaginatedList<OrderViewDto>(new List<OrderViewDto>(), 0, 1, 10)
    };

    _mockOrderService
        .Setup(x => x.GetOrdersAsync(parameters, userId, true))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetOrders(parameters);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    _mockOrderService.Verify(x => x.GetOrdersAsync(parameters, userId, true), Times.Once);
  }

  #endregion

  #region GetOrderById Tests

  /// <summary>
  /// 测试获取订单详情 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的订单详情
  /// </summary>
  [Fact]
  public async Task GetOrderById_ValidId_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    var orderView = new OrderViewDto
    {
      Id = orderId,
      EquipmentId = "equipment-id",
      EquipmentName = "Test Equipment",
      RenterId = userId,
      RenterName = "Test User",
      Status = OrderStatus.Pending,
      CreatedAt = DateTime.UtcNow
    };

    var successResponse = new ApiResponse<OrderViewDto>
    {
      Success = true,
      Data = orderView
    };

    _mockOrderService
        .Setup(x => x.GetOrderByIdAsync(orderId, userId, false))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetOrderById(orderId);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取订单详情 - 订单不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回订单不存在的错误消息
  /// </summary>
  [Fact]
  public async Task GetOrderById_OrderNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "non-existent-id";
    SetupUserContext(userId);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Order not found"
    };

    _mockOrderService
        .Setup(x => x.GetOrderByIdAsync(orderId, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetOrderById(orderId);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试获取订单详情 - 无权限场景
  /// 验证：
  /// - 返回403 Forbidden状态码
  /// - 返回权限不足的错误消息
  /// </summary>
  [Fact]
  public async Task GetOrderById_NoPermission_ReturnsForbid()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "You are not authorized to view this order"
    };

    _mockOrderService
        .Setup(x => x.GetOrderByIdAsync(orderId, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetOrderById(orderId);

    // Assert
    result.Should().BeOfType<ForbidResult>();
  }

  #endregion

  #region UpdateOrderStatus Tests

  /// <summary>
  /// 测试更新订单状态 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回更新后的订单信息
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var userId = "provider-user-id";
    var orderId = "order-id";
    var newStatus = OrderStatus.Accepted;
    SetupUserContext(userId, UserRoles.Provider);

    var orderView = new OrderViewDto
    {
      Id = orderId,
      EquipmentId = "equipment-id",
      EquipmentName = "Test Equipment",
      RenterId = "renter-id",
      RenterName = "Test Renter",
      Status = newStatus,
      CreatedAt = DateTime.UtcNow
    };

    var successResponse = new ApiResponse<OrderViewDto>
    {
      Success = true,
      Data = orderView,
      Message = "Order status updated successfully"
    };

    _mockOrderService
        .Setup(x => x.UpdateOrderStatusAsync(orderId, newStatus, userId, false))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.UpdateOrderStatus(orderId, newStatus);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试更新订单状态 - 订单不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回订单不存在的错误消息
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_OrderNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "provider-user-id";
    var orderId = "non-existent-id";
    var newStatus = OrderStatus.Accepted;
    SetupUserContext(userId, UserRoles.Provider);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Order not found"
    };

    _mockOrderService
        .Setup(x => x.UpdateOrderStatusAsync(orderId, newStatus, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.UpdateOrderStatus(orderId, newStatus);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试更新订单状态 - 无权限场景
  /// 验证：
  /// - 返回403 Forbidden状态码
  /// - 返回权限不足的错误消息
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_NoPermission_ReturnsForbid()
  {
    // Arrange
    var userId = "unauthorized-user-id";
    var orderId = "order-id";
    var newStatus = OrderStatus.Accepted;
    SetupUserContext(userId, UserRoles.Provider);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "You are not authorized to update this order"
    };

    _mockOrderService
        .Setup(x => x.UpdateOrderStatusAsync(orderId, newStatus, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.UpdateOrderStatus(orderId, newStatus);

    // Assert
    result.Should().BeOfType<ForbidResult>();
  }

  /// <summary>
  /// 测试更新订单状态 - 状态转换冲突场景
  /// 验证：
  /// - 返回409 Conflict状态码
  /// - 返回状态转换冲突的错误消息
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_InvalidStatusTransition_ReturnsConflict()
  {
    // Arrange
    var userId = "provider-user-id";
    var orderId = "order-id";
    var newStatus = OrderStatus.Completed;
    SetupUserContext(userId, UserRoles.Provider);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Invalid status transition from Pending to Completed"
    };

    _mockOrderService
        .Setup(x => x.UpdateOrderStatusAsync(orderId, newStatus, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.UpdateOrderStatus(orderId, newStatus);

    // Assert
    result.Should().BeOfType<ConflictObjectResult>();
  }

  #endregion

  #region CancelOrder Tests

  /// <summary>
  /// 测试取消订单 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回取消后的订单信息
  /// </summary>
  [Fact]
  public async Task CancelOrder_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    var orderView = new OrderViewDto
    {
      Id = orderId,
      EquipmentId = "equipment-id",
      EquipmentName = "Test Equipment",
      RenterId = userId,
      RenterName = "Test User",
      Status = OrderStatus.Cancelled,
      CreatedAt = DateTime.UtcNow
    };

    var successResponse = new ApiResponse<OrderViewDto>
    {
      Success = true,
      Data = orderView,
      Message = "Order cancelled successfully"
    };

    _mockOrderService
        .Setup(x => x.CancelOrderAsync(orderId, userId, false))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.CancelOrder(orderId);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试取消订单 - 订单不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回订单不存在的错误消息
  /// </summary>
  [Fact]
  public async Task CancelOrder_OrderNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "non-existent-id";
    SetupUserContext(userId);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Order not found"
    };

    _mockOrderService
        .Setup(x => x.CancelOrderAsync(orderId, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CancelOrder(orderId);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试取消订单 - 无权限场景
  /// 验证：
  /// - 返回403 Forbidden状态码
  /// - 返回权限不足的错误消息
  /// </summary>
  [Fact]
  public async Task CancelOrder_NoPermission_ReturnsForbid()
  {
    // Arrange
    var userId = "unauthorized-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "You are not authorized to cancel this order"
    };

    _mockOrderService
        .Setup(x => x.CancelOrderAsync(orderId, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CancelOrder(orderId);

    // Assert
    result.Should().BeOfType<ForbidResult>();
  }

  /// <summary>
  /// 测试取消订单 - 状态冲突场景
  /// 验证：
  /// - 返回409 Conflict状态码
  /// - 返回状态冲突的错误消息
  /// </summary>
  [Fact]
  public async Task CancelOrder_StatusConflict_ReturnsConflict()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    var errorResponse = new ApiResponse<OrderViewDto>
    {
      Success = false,
      Message = "Order cannot be cancelled"
    };

    _mockOrderService
        .Setup(x => x.CancelOrderAsync(orderId, userId, false))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CancelOrder(orderId);

    // Assert
    result.Should().BeOfType<ConflictObjectResult>();
  }

  #endregion

  #region Exception Handling Tests

  /// <summary>
  /// 测试创建订单 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录错误日志
  /// </summary>
  [Fact]
  public async Task CreateOrder_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new CreateOrderRequest();

    _mockOrderService
        .Setup(x => x.CreateOrderAsync(request, userId))
        .ThrowsAsync(new Exception("Test exception"));

    // Act
    var result = await _controller.CreateOrder(request);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
    var response = objectResult.Value as ApiResponse<OrderViewDto>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("An error occurred while creating order");
  }

  /// <summary>
  /// 测试获取订单列表 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录错误日志
  /// </summary>
  [Fact]
  public async Task GetOrders_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var parameters = new OrderQueryParameters();

    _mockOrderService
        .Setup(x => x.GetOrdersAsync(parameters, userId, false))
        .ThrowsAsync(new Exception("Test exception"));

    // Act
    var result = await _controller.GetOrders(parameters);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
  }

  /// <summary>
  /// 测试获取订单详情 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录错误日志
  /// </summary>
  [Fact]
  public async Task GetOrderById_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    _mockOrderService
        .Setup(x => x.GetOrderByIdAsync(orderId, userId, false))
        .ThrowsAsync(new Exception("Test exception"));

    // Act
    var result = await _controller.GetOrderById(orderId);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
  }

  /// <summary>
  /// 测试更新订单状态 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录错误日志
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "provider-user-id";
    var orderId = "order-id";
    var newStatus = OrderStatus.Accepted;
    SetupUserContext(userId, UserRoles.Provider);

    _mockOrderService
        .Setup(x => x.UpdateOrderStatusAsync(orderId, newStatus, userId, false))
        .ThrowsAsync(new Exception("Test exception"));

    // Act
    var result = await _controller.UpdateOrderStatus(orderId, newStatus);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
  }

  /// <summary>
  /// 测试取消订单 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录错误日志
  /// </summary>
  [Fact]
  public async Task CancelOrder_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "order-id";
    SetupUserContext(userId);

    _mockOrderService
        .Setup(x => x.CancelOrderAsync(orderId, userId, false))
        .ThrowsAsync(new Exception("Test exception"));

    // Act
    var result = await _controller.CancelOrder(orderId);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
  }

  #endregion
}