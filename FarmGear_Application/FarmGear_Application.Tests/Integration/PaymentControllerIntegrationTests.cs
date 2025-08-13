using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Security.Claims;
using FarmGear_Application;
using FarmGear_Application.DTOs.Payment;
using FarmGear_Application.DTOs.Equipment;
using FarmGear_Application.DTOs.Orders;
using FarmGear_Application.DTOs;
using FarmGear_Application.Services;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Interfaces.PaymentGateways;
using FarmGear_Application.Configuration;
using FarmGear_Application.Constants;
using FarmGear_Application.Models;
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
using FarmGear_Application.Enums;

namespace FarmGear_Application.Tests.Integration;

/// <summary>
/// 支付控制器的集成测试类
/// 用于测试支付管理API的端到端功能，包括：
/// - 支付意图的创建
/// - 支付状态查询
/// - 支付记录管理
/// - 身份认证和授权
/// - API响应状态
/// - 数据验证
/// </summary>
public class PaymentControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
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
  /// 测试管理员用户ID
  /// </summary>
  private string _testAdminUserId = string.Empty;

  /// <summary>
  /// 测试管理员用户Token
  /// </summary>
  private string _testAdminToken = string.Empty;

  /// <summary>
  /// 测试订单ID
  /// </summary>
  private string _testOrderId = string.Empty;

  /// <summary>
  /// 测试JWT密钥
  /// </summary>
  private const string TestJwtSecret = "test-secret-key-that-is-long-enough-for-testing-purposes-only-and-secure";

  /// <summary>
  /// 构造函数，初始化测试环境
  /// </summary>
  /// <param name="factory">Web应用程序工厂实例</param>
  public PaymentControllerIntegrationTests(WebApplicationFactory<Program> factory)
  {
    _factory = factory.WithWebHostBuilder(builder =>
    {
      // 配置测试环境
      builder.UseEnvironment("Testing");

      // 配置测试服务
      builder.ConfigureServices(services =>
      {
        // 移除原有的数据库上下文
        var descriptor = services.SingleOrDefault(
            d => d.ServiceType == typeof(Microsoft.EntityFrameworkCore.DbContextOptions<FarmGear_Application.Data.ApplicationDbContext>));
        if (descriptor != null)
        {
          services.Remove(descriptor);
        }

        // 使用内存数据库
        services.AddDbContext<FarmGear_Application.Data.ApplicationDbContext>(options =>
        {
          options.UseInMemoryDatabase("FarmGearPaymentTestDb");
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

        // 移除Redis服务，使用内存缓存替代
        var redisDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IRedisCacheService));
        if (redisDescriptor != null)
        {
          services.Remove(redisDescriptor);
        }
        services.AddSingleton<IRedisCacheService, FarmGear_Application.Tests.MockRedisCacheService>();

        // 移除AlipayService服务，使用模拟实现
        var alipayDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(FarmGear_Application.Interfaces.PaymentGateways.IAlipayService));
        if (alipayDescriptor != null)
        {
          services.Remove(alipayDescriptor);
        }
        services.AddScoped<FarmGear_Application.Interfaces.PaymentGateways.IAlipayService, FarmGear_Application.Tests.Mocks.MockAlipayService>();
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
    _testAdminToken = await CreateTestUserAndGetTokenAsync(services, "testadmin", "admin@example.com", "Test123!@#", "Admin");

    // 从Token中提取用户ID（简化处理）
    _testRenterUserId = "testrenter";
    _testAdminUserId = "testadmin";

    // 创建测试订单
    await CreateTestOrderAsync(services);
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
      string role = "Customer")
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
  /// 创建测试订单
  /// </summary>
  /// <param name="services">服务提供者</param>
  private async Task CreateTestOrderAsync(IServiceProvider services)
  {
    var context = services.GetRequiredService<FarmGear_Application.Data.ApplicationDbContext>();

    // 创建测试设备
    var equipment = new Equipment
    {
      Id = Guid.NewGuid().ToString(),
      Name = "Test Equipment for Payment",
      Description = "Test Description",
      DailyPrice = 100.00m,
      Latitude = 39.9042m,
      Longitude = 116.4074m,
      Type = "Tractor",
      OwnerId = "provider-id",
      Status = EquipmentStatus.Available,
      CreatedAt = DateTime.UtcNow
    };

    // 创建测试订单
    var order = new Order
    {
      Id = Guid.NewGuid().ToString(),
      EquipmentId = equipment.Id,
      RenterId = _testRenterUserId,
      StartDate = DateTime.UtcNow.AddDays(1),
      EndDate = DateTime.UtcNow.AddDays(3),
      TotalAmount = 200.00m,
      Status = OrderStatus.Accepted,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };

    context.Equipment.Add(equipment);
    context.Orders.Add(order);
    await context.SaveChangesAsync();

    _testOrderId = order.Id;
  }

  #region CreatePaymentIntent Tests

  /// <summary>
  /// 测试创建支付意图 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Arrange
    var request = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };

    // Act
    var response = await _client.PostAsJsonAsync("/api/payment", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试创建支付意图 - 有认证场景
  /// 验证：
  /// - 返回201 Created状态码
  /// - 返回正确的支付状态响应
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_WithAuthentication_ReturnsCreated()
  {
    // Arrange
    var request = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };

    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/payment", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Created);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaymentStatusResponse>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.OrderId.Should().Be(request.OrderId);
    apiResponse.Data.Status.Should().Be(PaymentStatus.Pending);
  }

  /// <summary>
  /// 测试创建支付意图 - 无效订单场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task CreatePaymentIntent_WithInvalidOrder_ReturnsNotFound()
  {
    // Arrange
    var request = new CreatePaymentIntentRequest
    {
      OrderId = "non-existent-order-id"
    };

    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/payment", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion

  #region GetPaymentStatus Tests

  /// <summary>
  /// 测试获取支付状态 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.GetAsync($"/api/payment/status/{_testOrderId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试获取支付状态 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的支付状态
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建支付意图
    var createRequest = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };
    await _client.PostAsJsonAsync("/api/payment", createRequest);

    // Act
    var response = await _client.GetAsync($"/api/payment/status/{_testOrderId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaymentStatusResponse>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.OrderId.Should().Be(_testOrderId);
  }

  /// <summary>
  /// 测试获取支付状态 - 无效订单场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentStatus_WithInvalidOrder_ReturnsNotFound()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.GetAsync("/api/payment/status/non-existent-order-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion

  #region GetPaymentRecords Tests

  /// <summary>
  /// 测试获取支付记录列表 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentRecords_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.GetAsync("/api/payment/records");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试获取支付记录列表 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回分页支付记录列表
  /// </summary>
  [Fact]
  public async Task GetPaymentRecords_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建支付意图
    var createRequest = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };
    await _client.PostAsJsonAsync("/api/payment", createRequest);

    // Act
    var response = await _client.GetAsync("/api/payment/records");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<PaymentStatusResponse>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Items.Should().NotBeNull();
  }

  /// <summary>
  /// 测试获取支付记录列表 - 带查询参数场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确处理查询参数
  /// </summary>
  [Fact]
  public async Task GetPaymentRecords_WithQueryParameters_ReturnsFilteredResults()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建支付意图
    var createRequest = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };
    await _client.PostAsJsonAsync("/api/payment", createRequest);

    // Act
    var response = await _client.GetAsync("/api/payment/records?pageNumber=1&pageSize=5&status=0");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<PaymentStatusResponse>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.PageSize.Should().Be(5);
  }

  /// <summary>
  /// 测试获取支付记录列表 - 管理员身份场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 可以查看所有支付记录
  /// </summary>
  [Fact]
  public async Task GetPaymentRecords_AsAdmin_ReturnsAllRecords()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testAdminToken);

    // 先创建支付意图
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);
    var createRequest = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };
    await _client.PostAsJsonAsync("/api/payment", createRequest);

    // 切换到管理员身份
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testAdminToken);

    // Act
    var response = await _client.GetAsync("/api/payment/records");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<PaymentStatusResponse>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
  }

  #endregion

  #region GetPaymentRecordById Tests

  /// <summary>
  /// 测试获取支付记录详情 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentRecordById_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.GetAsync("/api/payment/records/test-payment-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试获取支付记录详情 - 有效ID场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的支付记录详情
  /// </summary>
  [Fact]
  public async Task GetPaymentRecordById_WithValidId_ReturnsPaymentRecord()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建支付意图
    var createRequest = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };
    var createResponse = await _client.PostAsJsonAsync("/api/payment", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<PaymentStatusResponse>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var paymentId = createApiResponse!.Data!.Id;

    // Act
    var response = await _client.GetAsync($"/api/payment/records/{paymentId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaymentStatusResponse>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Id.Should().Be(paymentId);
  }

  /// <summary>
  /// 测试获取支付记录详情 - 无效ID场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task GetPaymentRecordById_WithInvalidId_ReturnsNotFound()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.GetAsync("/api/payment/records/non-existent-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion

  #region CancelPayment Tests

  /// <summary>
  /// 测试取消支付 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task CancelPayment_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.PutAsync("/api/payment/records/test-payment-id/cancel", null);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试取消支付 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确取消支付
  /// </summary>
  [Fact]
  public async Task CancelPayment_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建支付意图
    var createRequest = new CreatePaymentIntentRequest
    {
      OrderId = _testOrderId
    };
    var createResponse = await _client.PostAsJsonAsync("/api/payment", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<PaymentStatusResponse>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var paymentId = createApiResponse!.Data!.Id;

    // Act
    var response = await _client.PutAsync($"/api/payment/records/{paymentId}/cancel", null);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaymentStatusResponse>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data!.Status.Should().Be(PaymentStatus.Cancelled);
  }

  #endregion
}