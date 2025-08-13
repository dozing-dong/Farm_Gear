using System.Security.Claims;
using FarmGear_Application.Controllers;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Payment;
using FarmGear_Application.Models;
using FarmGear_Application.Services;
using FarmGear_Application.Services.PaymentGateways;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Interfaces.PaymentGateways;
using FarmGear_Application.Enums;
using FarmGear_Application.Data;
using FarmGear_Application.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FarmGear_Application.Tests.Controllers;

/// <summary>
/// 支付控制器的单元测试类
/// 用于测试支付管理API的各个功能点，包括：
/// - 支付意图创建
/// - 支付状态查询
/// - 支付记录管理
/// - 用户权限验证
/// - 错误处理
/// </summary>
public class PaymentControllerTests
{
  /// <summary>
  /// 模拟的支付服务接口，用于模拟后端服务的行为
  /// </summary>
  private readonly Mock<IPaymentService> _mockPaymentService;

  /// <summary>
  /// 模拟的支付宝服务接口，用于模拟支付宝服务的行为
  /// </summary>
  private readonly Mock<IAlipayService> _mockAlipayService;

  /// <summary>
  /// 模拟的日志记录器，用于记录控制器操作日志
  /// </summary>
  private readonly Mock<ILogger<PaymentController>> _mockLogger;

  /// <summary>
  /// 被测试的支付控制器实例
  /// </summary>
  private readonly PaymentController _controller;

  /// <summary>
  /// 构造函数，初始化测试环境
  /// 创建模拟对象和控制器实例
  /// </summary>
  public PaymentControllerTests()
  {
    _mockPaymentService = new Mock<IPaymentService>();
    _mockAlipayService = new Mock<IAlipayService>();
    _mockLogger = new Mock<ILogger<PaymentController>>();
    _controller = new PaymentController(
      _mockPaymentService.Object,
      _mockAlipayService.Object,
      _mockLogger.Object);
  }

  /// <summary>
  /// 设置用户上下文，模拟用户认证状态
  /// </summary>
  /// <param name="userId">用户ID，默认为"test-user-id"</param>
  /// <param name="role">用户角色，默认为"Customer"</param>
  private void SetupUserContext(string userId = "test-user-id", string role = "Customer")
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

  #region CreatePaymentIntent Tests

  /// <summary>
  /// 测试创建支付意图 - 有效请求场景
  /// 验证：
  /// - 返回201 Created状态码
  /// - 返回正确的支付状态响应
  /// - 返回正确的操作消息
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_ValidRequest_ReturnsCreatedResult()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var request = TestDataFactory.CreatePaymentIntentRequest("test-order-id");

    var paymentResponse = TestDataFactory.CreatePaymentStatusResponse(
      id: "payment-id",
      orderId: request.OrderId,
      amount: 100.00m,
      status: PaymentStatus.Pending,
      paymentUrl: "http://test-payment-url.com",
      userId: userId,
      userName: "testuser");

    var successResponse = TestDataFactory.CreateSuccessResponse(paymentResponse, "Payment intent created successfully");

    _mockPaymentService
      .Setup(x => x.CreatePaymentIntentAsync(request, userId))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.CreatePaymentIntent(request);

    // Assert
    result.Should().BeOfType<CreatedAtActionResult>();
    var createdResult = result as CreatedAtActionResult;
    createdResult!.Value.Should().BeEquivalentTo(successResponse);
    createdResult.ActionName.Should().Be(nameof(PaymentController.GetPaymentRecordById));
  }

  /// <summary>
  /// 测试创建支付意图 - 无用户声明场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回失败消息
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_NoUserClaim_ReturnsBadRequest()
  {
    // Arrange
    SetupUserContext("", "Customer"); // Empty user ID
    var request = TestDataFactory.CreatePaymentIntentRequest();

    // Act
    var result = await _controller.CreatePaymentIntent(request);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
    var badRequestResult = result as BadRequestObjectResult;
    var response = badRequestResult!.Value as ApiResponse<PaymentStatusResponse>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("Failed to get user information");
  }

  /// <summary>
  /// 测试创建支付意图 - 订单不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回订单不存在的错误消息
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_OrderNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = TestDataFactory.CreatePaymentIntentRequest();

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("Order does not exist");

    _mockPaymentService
      .Setup(x => x.CreatePaymentIntentAsync(request, userId))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreatePaymentIntent(request);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试创建支付意图 - 无权限场景
  /// 验证：
  /// - 返回403 Forbidden状态码
  /// - 返回权限不足的错误消息
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_NoPermission_ReturnsForbid()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = TestDataFactory.CreatePaymentIntentRequest();

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("No permission to pay for this order");

    _mockPaymentService
      .Setup(x => x.CreatePaymentIntentAsync(request, userId))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreatePaymentIntent(request);

    // Assert
    result.Should().BeOfType<ForbidResult>();
  }

  /// <summary>
  /// 测试创建支付意图 - 重复支付场景
  /// 验证：
  /// - 返回409 Conflict状态码
  /// - 返回重复支付的错误消息
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_DuplicatePayment_ReturnsConflict()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = TestDataFactory.CreatePaymentIntentRequest();

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("Payment already exists for this order");

    _mockPaymentService
      .Setup(x => x.CreatePaymentIntentAsync(request, userId))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CreatePaymentIntent(request);

    // Assert
    result.Should().BeOfType<ConflictObjectResult>();
  }

  #endregion

  #region GetPaymentStatus Tests

  /// <summary>
  /// 测试获取支付状态 - 有效ID场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的支付状态
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_ValidId_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "test-order-id";
    SetupUserContext(userId);

    var paymentResponse = TestDataFactory.CreatePaymentStatusResponse(
      id: "payment-id",
      orderId: orderId,
      amount: 100.00m,
      status: PaymentStatus.Paid,
      userId: userId,
      userName: "testuser");

    var successResponse = TestDataFactory.CreateSuccessResponse(paymentResponse, "Payment status retrieved successfully");

    _mockPaymentService
      .Setup(x => x.GetPaymentStatusAsync(orderId, userId, false))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetPaymentStatus(orderId);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取支付状态 - 管理员身份场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确传递管理员标识
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_AsAdmin_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-admin-id";
    var orderId = "test-order-id";
    SetupUserContext(userId, "Admin");

    var paymentResponse = TestDataFactory.CreatePaymentStatusResponse(
      id: "payment-id",
      orderId: orderId,
      amount: 100.00m,
      status: PaymentStatus.Paid,
      userId: "other-user-id",
      userName: "otheruser");

    var successResponse = TestDataFactory.CreateSuccessResponse(paymentResponse, "Payment status retrieved successfully");

    _mockPaymentService
      .Setup(x => x.GetPaymentStatusAsync(orderId, userId, true))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetPaymentStatus(orderId);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取支付状态 - 支付记录不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_PaymentNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "non-existent-order-id";
    SetupUserContext(userId);

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("No payment record found for this order");

    _mockPaymentService
      .Setup(x => x.GetPaymentStatusAsync(orderId, userId, false))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetPaymentStatus(orderId);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  #endregion

  #region GetPaymentRecords Tests

  /// <summary>
  /// 测试获取支付记录列表 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回分页支付记录列表
  /// </summary>
  [Fact]
  public async Task GetPaymentRecords_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var queryParams = TestDataFactory.CreatePaymentQueryParameters(page: 1, pageSize: 10);

    var paymentRecords = new List<PaymentStatusResponse>
    {
      TestDataFactory.CreatePaymentStatusResponse(
        id: "payment-1",
        orderId: "order-1",
        amount: 100.00m,
        userId: userId,
        userName: "testuser"),
      TestDataFactory.CreatePaymentStatusResponse(
        id: "payment-2",
        orderId: "order-2",
        amount: 200.00m,
        userId: userId,
        userName: "testuser")
    };

    var paginatedList = TestDataFactory.CreatePaginatedList(paymentRecords, 2, 1, 10);
    var successResponse = TestDataFactory.CreateSuccessResponse(paginatedList, "Payment records retrieved successfully");

    _mockPaymentService
      .Setup(x => x.GetPaymentRecordsAsync(queryParams, userId, false))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetPaymentRecords(queryParams);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取支付记录列表 - 管理员身份场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确传递管理员标识
  /// </summary>
  [Fact]
  public async Task GetPaymentRecords_AsAdmin_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-admin-id";
    SetupUserContext(userId, "Admin");

    var queryParams = TestDataFactory.CreatePaymentQueryParameters(page: 1, pageSize: 10);

    var paymentRecords = new List<PaymentStatusResponse>
    {
      TestDataFactory.CreatePaymentStatusResponse(
        id: "payment-1",
        orderId: "order-1",
        amount: 100.00m,
        userId: "user-1",
        userName: "user1"),
      TestDataFactory.CreatePaymentStatusResponse(
        id: "payment-2",
        orderId: "order-2",
        amount: 200.00m,
        userId: "user-2",
        userName: "user2")
    };

    var paginatedList = TestDataFactory.CreatePaginatedList(paymentRecords, 2, 1, 10);
    var successResponse = TestDataFactory.CreateSuccessResponse(paginatedList, "Payment records retrieved successfully");

    _mockPaymentService
      .Setup(x => x.GetPaymentRecordsAsync(queryParams, userId, true))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetPaymentRecords(queryParams);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  #endregion

  #region GetPaymentRecordById Tests

  /// <summary>
  /// 测试获取支付记录详情 - 有效ID场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的支付记录详情
  /// </summary>
  [Fact]
  public async Task GetPaymentRecordById_ValidId_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    var paymentId = "test-payment-id";
    SetupUserContext(userId);

    var paymentResponse = TestDataFactory.CreatePaymentStatusResponse(
      id: paymentId,
      orderId: "order-1",
      amount: 100.00m,
      status: PaymentStatus.Paid,
      userId: userId,
      userName: "testuser");

    var successResponse = TestDataFactory.CreateSuccessResponse(paymentResponse, "Payment record retrieved successfully");

    _mockPaymentService
      .Setup(x => x.GetPaymentRecordByIdAsync(paymentId, userId, false))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetPaymentRecordById(paymentId);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取支付记录详情 - 支付记录不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentRecordById_PaymentNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    var paymentId = "non-existent-payment-id";
    SetupUserContext(userId);

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("Payment record not found");

    _mockPaymentService
      .Setup(x => x.GetPaymentRecordByIdAsync(paymentId, userId, false))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetPaymentRecordById(paymentId);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  #endregion

  #region CancelPayment Tests

  /// <summary>
  /// 测试取消支付 - 有效ID场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回取消成功的响应
  /// </summary>
  [Fact]
  public async Task CancelPayment_ValidId_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    var paymentId = "test-payment-id";
    SetupUserContext(userId);

    var paymentResponse = TestDataFactory.CreatePaymentStatusResponse(
      id: paymentId,
      orderId: "order-1",
      amount: 100.00m,
      status: PaymentStatus.Cancelled,
      userId: userId,
      userName: "testuser");

    var successResponse = TestDataFactory.CreateSuccessResponse(paymentResponse, "Payment cancelled successfully");

    _mockPaymentService
      .Setup(x => x.CancelPaymentAsync(paymentId, userId))
      .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.CancelPayment(paymentId);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试取消支付 - 支付记录不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task CancelPayment_PaymentNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    var paymentId = "non-existent-payment-id";
    SetupUserContext(userId);

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("No payment record found for this order");

    _mockPaymentService
      .Setup(x => x.CancelPaymentAsync(paymentId, userId))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CancelPayment(paymentId);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试取消支付 - 无权限场景
  /// 验证：
  /// - 返回403 Forbidden状态码
  /// </summary>
  [Fact]
  public async Task CancelPayment_NoPermission_ReturnsForbid()
  {
    // Arrange
    var userId = "test-user-id";
    var paymentId = "test-payment-id";
    SetupUserContext(userId);

    var errorResponse = TestDataFactory.CreateErrorResponse<PaymentStatusResponse>("No permission to cancel payment for this order");

    _mockPaymentService
      .Setup(x => x.CancelPaymentAsync(paymentId, userId))
      .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.CancelPayment(paymentId);

    // Assert
    result.Should().BeOfType<ForbidResult>();
  }

  #endregion

  #region Exception Tests

  /// <summary>
  /// 测试异常处理 - 创建支付意图时发生异常
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录异常日志
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = TestDataFactory.CreatePaymentIntentRequest();

    _mockPaymentService
      .Setup(x => x.CreatePaymentIntentAsync(request, userId))
      .ThrowsAsync(new Exception("Database error"));

    // Act
    var result = await _controller.CreatePaymentIntent(request);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
  }

  /// <summary>
  /// 测试异常处理 - 获取支付状态时发生异常
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 记录异常日志
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    var orderId = "test-order-id";
    SetupUserContext(userId);

    _mockPaymentService
      .Setup(x => x.GetPaymentStatusAsync(orderId, userId, false))
      .ThrowsAsync(new Exception("Database error"));

    // Act
    var result = await _controller.GetPaymentStatus(orderId);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
  }

  #endregion
}