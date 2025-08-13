using System.Security.Claims;
using FarmGear_Application.Controllers;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Location;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Models;
using FarmGear_Application.Constants;
using FarmGear_Application.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FarmGear_Application.Tests.Controllers;

/// <summary>
/// 位置控制器的单元测试类
/// 用于测试位置管理API的各个功能点，包括：
/// - 位置的查询和更新操作
/// - 用户权限验证
/// - 错误处理
/// - 业务逻辑验证
/// </summary>
public class LocationControllerTests
{
  /// <summary>
  /// 模拟的位置服务接口，用于模拟后端服务的行为
  /// </summary>
  private readonly Mock<ILocationService> _mockLocationService;

  /// <summary>
  /// 模拟的日志记录器，用于记录控制器操作日志
  /// </summary>
  private readonly Mock<ILogger<LocationController>> _mockLogger;

  /// <summary>
  /// 被测试的位置控制器实例
  /// </summary>
  private readonly LocationController _controller;

  /// <summary>
  /// 构造函数，初始化测试环境
  /// 创建模拟对象和控制器实例
  /// </summary>
  public LocationControllerTests()
  {
    _mockLocationService = new Mock<ILocationService>();
    _mockLogger = new Mock<ILogger<LocationController>>();
    _controller = new LocationController(_mockLocationService.Object, _mockLogger.Object);
  }

  /// <summary>
  /// 设置用户上下文，模拟用户认证状态
  /// </summary>
  /// <param name="userId">用户ID，默认为"test-user-id"</param>
  /// <param name="role">用户角色，默认为Provider</param>
  private void SetupUserContext(string userId = "test-user-id", string role = UserRoles.Provider)
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

  #region GetNearbyEquipment Tests

  /// <summary>
  /// 测试获取附近设备 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的设备列表
  /// - 返回正确的操作消息
  /// </summary>
  [Fact]
  public async Task GetNearbyEquipment_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var parameters = new LocationQueryParameters
    {
      Latitude = 39.9042,
      Longitude = 116.4074,
      Radius = 5000,
      PageNumber = 1,
      PageSize = 10
    };

    var equipmentList = new List<EquipmentLocationDto>
        {
            new EquipmentLocationDto
            {
                Id = "equipment-1",
                Name = "Test Equipment",
                DailyPrice = 100.00m,
                Latitude = 39.9042,
                Longitude = 116.4074,
                Distance = 100.5,
                Status = EquipmentStatus.Available,
                OwnerName = "Test Owner"
            }
        };

    var paginatedList = new PaginatedList<EquipmentLocationDto>(equipmentList, 1, 1, 10);

    var successResponse = new ApiResponse<PaginatedList<EquipmentLocationDto>>
    {
      Success = true,
      Data = paginatedList,
      Message = "Nearby equipment retrieved successfully"
    };

    _mockLocationService
        .Setup(x => x.GetNearbyEquipmentAsync(parameters))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetNearbyEquipment(parameters);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取附近设备 - 无效坐标场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回坐标无效的错误消息
  /// </summary>
  [Fact]
  public async Task GetNearbyEquipment_InvalidCoordinates_ReturnsBadRequest()
  {
    // Arrange
    var parameters = new LocationQueryParameters
    {
      Latitude = 200, // 无效纬度
      Longitude = 300, // 无效经度
      Radius = 5000
    };

    var errorResponse = new ApiResponse<PaginatedList<EquipmentLocationDto>>
    {
      Success = false,
      Message = "Invalid coordinates provided"
    };

    _mockLocationService
        .Setup(x => x.GetNearbyEquipmentAsync(parameters))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetNearbyEquipment(parameters);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
    var badRequestResult = result as BadRequestObjectResult;
    var response = badRequestResult!.Value as ApiResponse<PaginatedList<EquipmentLocationDto>>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("Invalid coordinates provided");
  }

  /// <summary>
  /// 测试获取附近设备 - 服务异常场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 返回服务器错误消息
  /// </summary>
  [Fact]
  public async Task GetNearbyEquipment_ServiceException_ReturnsInternalServerError()
  {
    // Arrange
    var parameters = new LocationQueryParameters
    {
      Latitude = 39.9042,
      Longitude = 116.4074,
      Radius = 5000
    };

    _mockLocationService
        .Setup(x => x.GetNearbyEquipmentAsync(parameters))
        .ThrowsAsync(new Exception("Database connection failed"));

    // Act
    var result = await _controller.GetNearbyEquipment(parameters);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
    var response = objectResult.Value as ApiResponse<PaginatedList<EquipmentLocationDto>>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("An error occurred while retrieving nearby equipment");
  }

  #endregion

  #region GetHeatmapData Tests

  /// <summary>
  /// 测试获取热力图数据 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的热力图数据
  /// </summary>
  [Fact]
  public async Task GetHeatmapData_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var heatmapData = new List<HeatmapPoint>
        {
            new HeatmapPoint
            {
                Latitude = 39.9042,
                Longitude = 116.4074,
                Weight = 5
            }
        };

    var successResponse = new ApiResponse<List<HeatmapPoint>>
    {
      Success = true,
      Data = heatmapData,
      Message = "Heatmap data retrieved successfully"
    };

    _mockLocationService
        .Setup(x => x.GetEquipmentHeatmapAsync(39.9, 116.4, 40.0, 116.5, null, null))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetEquipmentHeatmap(39.9, 116.4, 40.0, 116.5, null, null);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取热力图数据 - 无效边界场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回边界无效的错误消息
  /// </summary>
  [Fact]
  public async Task GetHeatmapData_InvalidBounds_ReturnsBadRequest()
  {
    // Arrange
    var errorResponse = new ApiResponse<List<HeatmapPoint>>
    {
      Success = false,
      Message = "Invalid bounds provided"
    };

    _mockLocationService
        .Setup(x => x.GetEquipmentHeatmapAsync(40.0, 116.5, 39.9, 116.4, null, null)) // 边界颠倒
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetEquipmentHeatmap(40.0, 116.5, 39.9, 116.4, null, null);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  #endregion

  #region UpdateMyLocation Tests

  /// <summary>
  /// 测试更新我的位置 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回更新后的位置信息
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var request = new UpdateLocationRequest
    {
      Latitude = 39.9042,
      Longitude = 116.4074
    };

    var locationView = new LocationViewDto
    {
      UserId = userId,
      Username = "testuser",
      Latitude = request.Latitude,
      Longitude = request.Longitude,
      UpdatedAt = DateTime.UtcNow
    };

    var successResponse = new ApiResponse<LocationViewDto>
    {
      Success = true,
      Data = locationView,
      Message = "Location updated successfully"
    };

    _mockLocationService
        .Setup(x => x.UpdateUserLocationAsync(userId, request))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.UpdateMyLocation(request);

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试更新我的位置 - 无用户声明场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回无法获取用户信息的错误消息
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_NoUserClaim_ReturnsBadRequest()
  {
    // Arrange
    SetupUserContext("", "Provider"); // Empty user ID
    var request = new UpdateLocationRequest
    {
      Latitude = 39.9042,
      Longitude = 116.4074
    };

    // Act
    var result = await _controller.UpdateMyLocation(request);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
    var badRequestResult = result as BadRequestObjectResult;
    var response = badRequestResult!.Value as ApiResponse<LocationViewDto>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("Failed to get user information");
  }

  /// <summary>
  /// 测试更新我的位置 - 用户不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回用户不存在的错误消息
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_UserNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new UpdateLocationRequest
    {
      Latitude = 39.9042,
      Longitude = 116.4074
    };

    var errorResponse = new ApiResponse<LocationViewDto>
    {
      Success = false,
      Message = "User does not exist"
    };

    _mockLocationService
        .Setup(x => x.UpdateUserLocationAsync(userId, request))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.UpdateMyLocation(request);

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  /// <summary>
  /// 测试更新我的位置 - 无效坐标场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回坐标无效的错误消息
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_InvalidCoordinates_ReturnsBadRequest()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new UpdateLocationRequest
    {
      Latitude = 200, // 无效纬度
      Longitude = 300  // 无效经度
    };

    var errorResponse = new ApiResponse<LocationViewDto>
    {
      Success = false,
      Message = "Invalid coordinates provided"
    };

    _mockLocationService
        .Setup(x => x.UpdateUserLocationAsync(userId, request))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.UpdateMyLocation(request);

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  #endregion

  #region GetMyLocation Tests

  /// <summary>
  /// 测试获取我的位置 - 有效请求场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的位置信息
  /// </summary>
  [Fact]
  public async Task GetMyLocation_ValidRequest_ReturnsOkResult()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var locationView = new LocationViewDto
    {
      UserId = userId,
      Username = "testuser",
      Latitude = 39.9042,
      Longitude = 116.4074,
      UpdatedAt = DateTime.UtcNow
    };

    var successResponse = new ApiResponse<LocationViewDto>
    {
      Success = true,
      Data = locationView,
      Message = "Location retrieved successfully"
    };

    _mockLocationService
        .Setup(x => x.GetUserLocationAsync(userId))
        .ReturnsAsync(successResponse);

    // Act
    var result = await _controller.GetMyLocation();

    // Assert
    result.Should().BeOfType<OkObjectResult>();
    var okResult = result as OkObjectResult;
    okResult!.Value.Should().BeEquivalentTo(successResponse);
  }

  /// <summary>
  /// 测试获取我的位置 - 无用户声明场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回无法获取用户信息的错误消息
  /// </summary>
  [Fact]
  public async Task GetMyLocation_NoUserClaim_ReturnsBadRequest()
  {
    // Arrange
    SetupUserContext("", UserRoles.Provider); // Empty user ID

    // Act
    var result = await _controller.GetMyLocation();

    // Assert
    result.Should().BeOfType<BadRequestObjectResult>();
    var badRequestResult = result as BadRequestObjectResult;
    var response = badRequestResult!.Value as ApiResponse<LocationViewDto>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("Failed to get user information");
  }

  /// <summary>
  /// 测试获取我的位置 - 位置不存在场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// - 返回位置不存在的错误消息
  /// </summary>
  [Fact]
  public async Task GetMyLocation_LocationNotExists_ReturnsNotFound()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    var errorResponse = new ApiResponse<LocationViewDto>
    {
      Success = false,
      Message = "User does not exist"
    };

    _mockLocationService
        .Setup(x => x.GetUserLocationAsync(userId))
        .ReturnsAsync(errorResponse);

    // Act
    var result = await _controller.GetMyLocation();

    // Assert
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  #endregion

  #region Exception Handling Tests

  /// <summary>
  /// 测试更新位置 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 返回服务器错误消息
  /// - 记录异常日志
  /// </summary>
  [Fact]
  public async Task UpdateMyLocation_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);
    var request = new UpdateLocationRequest
    {
      Latitude = 39.9042,
      Longitude = 116.4074
    };

    _mockLocationService
        .Setup(x => x.UpdateUserLocationAsync(userId, request))
        .ThrowsAsync(new Exception("Database connection failed"));

    // Act
    var result = await _controller.UpdateMyLocation(request);

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
    var response = objectResult.Value as ApiResponse<LocationViewDto>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("An error occurred while updating user location");
  }

  /// <summary>
  /// 测试获取位置 - 异常抛出场景
  /// 验证：
  /// - 返回500 Internal Server Error状态码
  /// - 返回服务器错误消息
  /// - 记录异常日志
  /// </summary>
  [Fact]
  public async Task GetMyLocation_ExceptionThrown_ReturnsInternalServerError()
  {
    // Arrange
    var userId = "test-user-id";
    SetupUserContext(userId);

    _mockLocationService
        .Setup(x => x.GetUserLocationAsync(userId))
        .ThrowsAsync(new Exception("Database connection failed"));

    // Act
    var result = await _controller.GetMyLocation();

    // Assert
    result.Should().BeOfType<ObjectResult>();
    var objectResult = result as ObjectResult;
    objectResult!.StatusCode.Should().Be(500);
    var response = objectResult.Value as ApiResponse<LocationViewDto>;
    response!.Success.Should().BeFalse();
    response.Message.Should().Be("An error occurred while retrieving user location");
  }

  #endregion
}