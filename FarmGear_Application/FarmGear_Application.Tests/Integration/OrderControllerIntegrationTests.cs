using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Security.Claims;
using FarmGear_Application;
using FarmGear_Application.DTOs.Orders;
using FarmGear_Application.DTOs.Equipment;
using FarmGear_Application.DTOs;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Interfaces.Common;
using FarmGear_Application.Configuration;
using FarmGear_Application.Constants;
using FarmGear_Application.Models;
using FarmGear_Application.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity;
using FarmGear_Application.Data;
using Xunit;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;


namespace FarmGear_Application.Tests.Integration;

/// <summary>
/// 订单控制器的集成测试类
/// 用于测试订单管理API的端到端功能，包括：
/// - 订单的CRUD操作
/// - 身份认证和授权
/// - API响应状态
/// - 数据验证
/// </summary>
public class OrderControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
  /// <summary>
  /// Web应用程序工厂实例，用于创建测试服务器
  /// </summary>
  private readonly WebApplicationFactory<Program> _factory;

  /// <summary>
  /// HTTP客户端实例，用于发送测试请求
  /// </summary>
  private readonly HttpClient _client;

  /// <summary>
  /// 测试租客用户ID
  /// </summary>
  private string _testRenterUserId = string.Empty;

  /// <summary>
  /// 测试租客用户Token
  /// </summary>
  private string _testRenterToken = string.Empty;

  /// <summary>
  /// 测试供应商用户ID
  /// </summary>
  private string _testProviderUserId = string.Empty;

  /// <summary>
  /// 测试供应商用户Token
  /// </summary>
  private string _testProviderToken = string.Empty;

  /// <summary>
  /// 测试设备ID
  /// </summary>
  private string _testEquipmentId = string.Empty;

  /// <summary>
  /// 测试JWT密钥
  /// </summary>
  private const string TestJwtSecret = "test-secret-key-that-is-long-enough-for-testing-purposes-only-and-secure";

  /// <summary>
  /// 构造函数，初始化测试环境
  /// </summary>
  /// <param name="factory">Web应用程序工厂实例</param>
  public OrderControllerIntegrationTests(WebApplicationFactory<Program> factory)
  {
    _factory = factory.WithWebHostBuilder(builder =>
    {
      // 配置测试环境
      builder.UseEnvironment("Testing");

      // 配置测试服务
      builder.ConfigureServices(services =>
      {
        // 移除原有的数据库上下文
        var dbDescriptor = services.SingleOrDefault(
            d => d.ServiceType == typeof(Microsoft.EntityFrameworkCore.DbContextOptions<FarmGear_Application.Data.ApplicationDbContext>));
        if (dbDescriptor != null)
        {
          services.Remove(dbDescriptor);
        }

        // 移除Redis连接
        var redisConnectionDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(StackExchange.Redis.IConnectionMultiplexer));
        if (redisConnectionDescriptor != null)
        {
          services.Remove(redisConnectionDescriptor);
        }

        // 使用内存数据库
        services.AddDbContext<FarmGear_Application.Data.ApplicationDbContext>(options =>
        {
          options.UseInMemoryDatabase("FarmGearOrderTestDb");
        });

        // 配置测试用的JWT设置
        services.Configure<FarmGear_Application.Configuration.JwtSettings>(options =>
        {
          options.SecretKey = TestJwtSecret;
          options.Issuer = "test-issuer";
          options.Audience = "test-audience";
          options.ExpiryInMinutes = 60;
        });

        // 重新配置JWT认证选项
        services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
        {
          options.TokenValidationParameters = new TokenValidationParameters
          {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = "test-issuer",
            ValidateAudience = true,
            ValidAudience = "test-audience",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
          };
        });

        // 添加Mock Redis连接
        services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
        {
          // 返回一个空的Mock连接，避免连接真实Redis
          return null!; // 在测试中IRedisCacheService会被Mock替换
        });

        // 移除Redis服务，使用内存缓存替代
        var redisDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IRedisCacheService));
        if (redisDescriptor != null)
        {
          services.Remove(redisDescriptor);
        }
        services.AddSingleton<IRedisCacheService, FarmGear_Application.Tests.MockRedisCacheService>();

        // 移除EmailSender服务，使用模拟实现
        var emailDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(FarmGear_Application.Interfaces.Common.IEmailSender));
        if (emailDescriptor != null)
        {
          services.Remove(emailDescriptor);
        }
        services.AddScoped<FarmGear_Application.Interfaces.Common.IEmailSender, FarmGear_Application.Services.EmailSender>();
      });
    });

    // 创建测试客户端
    _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
      AllowAutoRedirect = false
    });

    // 初始化测试数据
    InitializeTestDataAsync().Wait();
  }

  /// <summary>
  /// 初始化测试数据
  /// </summary>
  private async Task InitializeTestDataAsync()
  {
    using var scope = _factory.Services.CreateScope();
    var services = scope.ServiceProvider;

    // 初始化数据库
    await InitializeTestDatabaseAsync(services);

    // 创建测试用户
    _testRenterToken = await CreateTestUserAndGetTokenAsync(services, "testrenter", "renter@example.com", "Test123!@#", "Customer");
    _testProviderToken = await CreateTestUserAndGetTokenAsync(services, "testprovider", "provider@example.com", "Test123!@#", UserRoles.Provider);

    // 从Token中提取用户ID（简化处理）
    _testRenterUserId = "testrenter";
    _testProviderUserId = "testprovider";

    // 创建测试设备
    await CreateTestEquipmentAsync(services);
  }

  /// <summary>
  /// 初始化测试数据库
  /// </summary>
  /// <param name="services">服务提供者</param>
  private async Task InitializeTestDatabaseAsync(IServiceProvider services)
  {
    var context = services.GetRequiredService<FarmGear_Application.Data.ApplicationDbContext>();
    var roleSeedService = services.GetRequiredService<FarmGear_Application.Services.RoleSeedService>();

    // 确保数据库已创建（内存数据库会自动创建）
    await context.Database.EnsureCreatedAsync();

    // 初始化角色
    await roleSeedService.SeedRolesAsync();
  }

  /// <summary>
  /// 创建测试用户并返回认证Token
  /// </summary>
  /// <param name="services">服务提供者</param>
  /// <param name="username">用户名</param>
  /// <param name="email">邮箱</param>
  /// <param name="password">密码</param>
  /// <param name="role">角色</param>
  /// <returns>认证Token</returns>
  private async Task<string> CreateTestUserAndGetTokenAsync(
      IServiceProvider services,
      string username = "testuser",
      string email = "test@example.com",
      string password = "Test123!@#",
      string role = UserRoles.Farmer)
  {
    var userManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<FarmGear_Application.Models.AppUser>>();
    var roleManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Microsoft.AspNetCore.Identity.IdentityRole>>();
    var jwtService = services.GetRequiredService<FarmGear_Application.Services.EnhancedJwtService>();

    // 确保角色存在
    if (!await roleManager.RoleExistsAsync(role))
    {
      await roleManager.CreateAsync(new Microsoft.AspNetCore.Identity.IdentityRole(role));
    }

    // 检查用户是否已存在
    var existingUser = await userManager.FindByNameAsync(username);
    if (existingUser == null)
    {
      var user = new FarmGear_Application.Models.AppUser
      {
        UserName = username,
        Email = email,
        EmailConfirmed = true,
        Id = username // 简化ID设置
      };

      var result = await userManager.CreateAsync(user, password);
      if (result.Succeeded)
      {
        await userManager.AddToRoleAsync(user, role);
        existingUser = user;
      }
    }

    if (existingUser != null)
    {
      return await jwtService.GenerateTokenWithSessionAsync(existingUser);
    }

    throw new InvalidOperationException("Failed to create test user");
  }

  /// <summary>
  /// 创建测试设备
  /// </summary>
  /// <param name="services">服务提供者</param>
  private async Task CreateTestEquipmentAsync(IServiceProvider services)
  {
    var context = services.GetRequiredService<FarmGear_Application.Data.ApplicationDbContext>();

    var equipment = new Equipment
    {
      Id = Guid.NewGuid().ToString(),
      Name = "Test Equipment for Orders",
      Description = "Test Description",
      DailyPrice = 100.00m,
      Latitude = 39.9042m,
      Longitude = 116.4074m,
      Type = "Tractor",
      OwnerId = _testProviderUserId,
      Status = EquipmentStatus.Available,
      CreatedAt = DateTime.UtcNow
    };

    context.Equipment.Add(equipment);
    await context.SaveChangesAsync();

    _testEquipmentId = equipment.Id;
  }

  #region CreateOrder Tests

  /// <summary>
  /// 测试创建订单 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task CreateOrder_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Arrange
    var request = CreateTestOrderRequest();

    // Act
    var response = await _client.PostAsJsonAsync("/api/order", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试创建订单 - 有认证场景
  /// 验证：
  /// - 返回201 Created状态码
  /// - 返回正确的订单信息
  /// </summary>
  [Fact]
  public async Task CreateOrder_WithAuthentication_ReturnsCreated()
  {
    // Arrange
    var request = CreateTestOrderRequest();
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/order", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Created);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.EquipmentId.Should().Be(request.EquipmentId);
    apiResponse.Data.RenterId.Should().Be(_testRenterUserId);
    apiResponse.Data.Status.Should().Be(OrderStatus.Pending);
  }

  /// <summary>
  /// 测试创建订单 - 无效请求场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// - 返回错误信息
  /// </summary>
  [Fact]
  public async Task CreateOrder_WithInvalidRequest_ReturnsBadRequest()
  {
    // Arrange
    var request = new CreateOrderRequest
    {
      EquipmentId = _testEquipmentId,
      StartDate = DateTime.UtcNow.AddDays(-1), // 过去的日期
      EndDate = DateTime.UtcNow.AddDays(1)
    };

    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/order", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
  }

  #endregion

  #region GetOrders Tests

  /// <summary>
  /// 测试获取订单列表 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task GetOrders_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.GetAsync("/api/order");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试获取订单列表 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回分页订单列表
  /// </summary>
  [Fact]
  public async Task GetOrders_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.GetAsync("/api/order");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<OrderViewDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Items.Should().NotBeNull();
  }

  /// <summary>
  /// 测试获取订单列表 - 带查询参数场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确处理查询参数
  /// </summary>
  [Fact]
  public async Task GetOrders_WithQueryParameters_ReturnsFilteredResults()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个订单
    var createRequest = CreateTestOrderRequest();
    await _client.PostAsJsonAsync("/api/order", createRequest);

    // Act
    var response = await _client.GetAsync("/api/order?pageNumber=1&pageSize=5&status=0");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<OrderViewDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.PageSize.Should().Be(5);
  }

  #endregion

  #region GetOrderById Tests

  /// <summary>
  /// 测试获取订单详情 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task GetOrderById_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.GetAsync("/api/order/test-order-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试获取订单详情 - 有效ID场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的订单详情
  /// </summary>
  [Fact]
  public async Task GetOrderById_WithValidId_ReturnsOrder()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个订单
    var createRequest = CreateTestOrderRequest();
    var createResponse = await _client.PostAsJsonAsync("/api/order", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var orderId = createApiResponse!.Data!.Id;

    // Act
    var response = await _client.GetAsync($"/api/order/{orderId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Id.Should().Be(orderId);
  }

  /// <summary>
  /// 测试获取订单详情 - 无效ID场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task GetOrderById_WithInvalidId_ReturnsNotFound()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.GetAsync("/api/order/non-existent-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion

  #region UpdateOrderStatus Tests

  /// <summary>
  /// 测试更新订单状态 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.PutAsJsonAsync("/api/order/test-order-id/status", OrderStatus.Accepted);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试更新订单状态 - 供应商用户场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确更新订单状态
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_AsProvider_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个订单
    var createRequest = CreateTestOrderRequest();
    var createResponse = await _client.PostAsJsonAsync("/api/order", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var orderId = createApiResponse!.Data!.Id;

    // 切换到供应商Token
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testProviderToken);

    // Act
    var response = await _client.PutAsJsonAsync($"/api/order/{orderId}/status", OrderStatus.Accepted);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data!.Status.Should().Be(OrderStatus.Accepted);
  }

  /// <summary>
  /// 测试更新订单状态 - 无权限用户场景
  /// 验证：
  /// - 返回403 Forbidden状态码
  /// </summary>
  [Fact]
  public async Task UpdateOrderStatus_WithoutPermission_ReturnsForbidden()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个订单
    var createRequest = CreateTestOrderRequest();
    var createResponse = await _client.PostAsJsonAsync("/api/order", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var orderId = createApiResponse!.Data!.Id;

    // 尝试用租客身份更新状态（应该被拒绝）
    // Act
    var response = await _client.PutAsJsonAsync($"/api/order/{orderId}/status", OrderStatus.Accepted);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
  }

  #endregion

  #region CancelOrder Tests

  /// <summary>
  /// 测试取消订单 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task CancelOrder_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.PutAsync("/api/order/test-order-id/cancel", null);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试取消订单 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确取消订单
  /// </summary>
  [Fact]
  public async Task CancelOrder_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个订单
    var createRequest = CreateTestOrderRequest();
    var createResponse = await _client.PostAsJsonAsync("/api/order", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var orderId = createApiResponse!.Data!.Id;

    // Act
    var response = await _client.PutAsync($"/api/order/{orderId}/cancel", null);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<OrderViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data!.Status.Should().Be(OrderStatus.Cancelled);
  }

  #endregion

  /// <summary>
  /// 创建测试订单请求
  /// </summary>
  /// <param name="equipmentId">设备ID</param>
  /// <param name="startDate">开始日期</param>
  /// <param name="endDate">结束日期</param>
  /// <returns>订单请求对象</returns>
  private CreateOrderRequest CreateTestOrderRequest(
      string? equipmentId = null,
      DateTime? startDate = null,
      DateTime? endDate = null)
  {
    return new CreateOrderRequest
    {
      EquipmentId = equipmentId ?? _testEquipmentId,
      StartDate = startDate ?? DateTime.UtcNow.AddDays(1),
      EndDate = endDate ?? DateTime.UtcNow.AddDays(3)
    };
  }

  /// <summary>
  /// 创建测试订单查询参数
  /// </summary>
  /// <param name="page">页码</param>
  /// <param name="pageSize">每页大小</param>
  /// <param name="status">订单状态</param>
  /// <param name="equipmentId">设备ID</param>
  /// <returns>查询参数对象</returns>
  private static OrderQueryParameters CreateTestOrderQueryParameters(
      int page = 1,
      int pageSize = 10,
      OrderStatus? status = null,
      string? equipmentId = null)
  {
    return new OrderQueryParameters
    {
      PageNumber = page,
      PageSize = pageSize,
      Status = status,
      EquipmentId = equipmentId
    };
  }
}


