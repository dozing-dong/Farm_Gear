using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Security.Claims;
using FarmGear_Application;
using FarmGear_Application.DTOs.Reviews;
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
/// 评论控制器的集成测试类
/// 用于测试评论管理API的端到端功能，包括：
/// - 评论的CRUD操作
/// - 身份认证和授权
/// - API响应状态
/// - 数据验证
/// </summary>
public class ReviewControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
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
  /// 测试设备ID
  /// </summary>
  private string _testEquipmentId = string.Empty;

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
  public ReviewControllerIntegrationTests(WebApplicationFactory<Program> factory)
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
          options.UseInMemoryDatabase("FarmGearReviewTestDb");
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
    _testRenterToken = await CreateTestUserAndGetTokenAsync(services, "testrenter", "renter@example.com", "Test123!@#", UserRoles.Farmer);
    _testAdminToken = await CreateTestUserAndGetTokenAsync(services, "testadmin", "admin@example.com", "Test123!@#", UserRoles.Admin);

    // 从Token中提取用户ID（简化处理）
    _testRenterUserId = "testrenter";
    _testAdminUserId = "testadmin";

    // 创建测试数据
    await CreateTestDataAsync(services);
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
  /// 创建测试数据
  /// </summary>
  /// <param name="services">服务提供者</param>
  private async Task CreateTestDataAsync(IServiceProvider services)
  {
    var context = services.GetRequiredService<FarmGear_Application.Data.ApplicationDbContext>();

    // 创建测试设备
    var equipment = new Equipment
    {
      Id = Guid.NewGuid().ToString(),
      Name = "Test Equipment for Review",
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
      StartDate = DateTime.UtcNow.AddDays(-3),
      EndDate = DateTime.UtcNow.AddDays(-1),
      TotalAmount = 200.00m,
      Status = OrderStatus.Completed,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };

    context.Equipment.Add(equipment);
    context.Orders.Add(order);
    await context.SaveChangesAsync();

    _testEquipmentId = equipment.Id;
    _testOrderId = order.Id;
  }

  #region CreateReview Tests

  /// <summary>
  /// 测试创建评论 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task CreateReview_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Arrange
    var request = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      OrderId = _testOrderId,
      Rating = 5,
      Content = "Great equipment!"
    };

    // Act
    var response = await _client.PostAsJsonAsync("/api/review", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试创建评论 - 有认证场景
  /// 验证：
  /// - 返回201 Created状态码
  /// - 返回正确的评论信息
  /// </summary>
  [Fact]
  public async Task CreateReview_WithAuthentication_ReturnsCreated()
  {
    // Arrange
    var request = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      OrderId = _testOrderId,
      Rating = 5,
      Content = "Great equipment!"
    };

    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/review", request);

    // Assert
    var content = await response.Content.ReadAsStringAsync();
    System.Console.WriteLine($"Response Status: {response.StatusCode}");
    System.Console.WriteLine($"Response Content: {content}");

    response.StatusCode.Should().Be(HttpStatusCode.Created);

    var apiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.EquipmentId.Should().Be(request.EquipmentId);
    apiResponse.Data.Rating.Should().Be(request.Rating);
    apiResponse.Data.Content.Should().Be(request.Content);
  }

  /// <summary>
  /// 测试创建评论 - 无效设备场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task CreateReview_WithInvalidEquipment_ReturnsNotFound()
  {
    // Arrange
    var request = new CreateReviewRequest
    {
      EquipmentId = "non-existent-equipment-id",
      OrderId = _testOrderId,
      Rating = 5,
      Content = "Great equipment!"
    };

    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/review", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  /// <summary>
  /// 测试创建评论 - 无效请求场景
  /// 验证：
  /// - 返回400 BadRequest状态码
  /// </summary>
  [Fact]
  public async Task CreateReview_WithInvalidRequest_ReturnsBadRequest()
  {
    // Arrange
    var request = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      OrderId = _testOrderId,
      Rating = 0, // 无效评分
      Content = "Great equipment!"
    };

    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.PostAsJsonAsync("/api/review", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
  }

  #endregion

  #region GetReviews Tests

  /// <summary>
  /// 测试获取评论列表 - 无认证场景
  /// 验证：
  /// - 返回200 OK状态码（公开接口）
  /// - 返回分页评论列表
  /// </summary>
  [Fact]
  public async Task GetReviews_WithoutAuthentication_ReturnsSuccess()
  {
    // Act
    var response = await _client.GetAsync("/api/review");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<ReviewViewDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Items.Should().NotBeNull();
  }

  /// <summary>
  /// 测试获取评论列表 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回分页评论列表
  /// </summary>
  [Fact]
  public async Task GetReviews_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个评论
    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    await _client.PostAsJsonAsync("/api/review", createRequest);

    // Act
    var response = await _client.GetAsync("/api/review");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<ReviewViewDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Items.Should().NotBeNull();
  }

  /// <summary>
  /// 测试获取评论列表 - 带查询参数场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 正确处理查询参数
  /// </summary>
  [Fact]
  public async Task GetReviews_WithQueryParameters_ReturnsFilteredResults()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个评论
    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    await _client.PostAsJsonAsync("/api/review", createRequest);

    // Act
    var response = await _client.GetAsync($"/api/review?pageNumber=1&pageSize=5&equipmentId={_testEquipmentId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<PaginatedList<ReviewViewDto>>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.PageSize.Should().Be(5);
  }

  #endregion

  #region GetReviewById Tests

  /// <summary>
  /// 测试获取评论详情 - 无认证场景
  /// 验证：
  /// - 返回200 OK状态码（公开接口）
  /// - 返回正确的评论详情
  /// </summary>
  [Fact]
  public async Task GetReviewById_WithoutAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个评论
    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    var createResponse = await _client.PostAsJsonAsync("/api/review", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var reviewId = createApiResponse!.Data!.Id;

    // 移除认证头
    _client.DefaultRequestHeaders.Authorization = null;

    // Act
    var response = await _client.GetAsync($"/api/review/{reviewId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Id.Should().Be(reviewId);
  }

  /// <summary>
  /// 测试获取评论详情 - 有效ID场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回正确的评论详情
  /// </summary>
  [Fact]
  public async Task GetReviewById_WithValidId_ReturnsReview()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个评论
    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    var createResponse = await _client.PostAsJsonAsync("/api/review", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var reviewId = createApiResponse!.Data!.Id;

    // Act
    var response = await _client.GetAsync($"/api/review/{reviewId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Id.Should().Be(reviewId);
  }

  /// <summary>
  /// 测试获取评论详情 - 无效ID场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task GetReviewById_WithInvalidId_ReturnsNotFound()
  {
    // Act
    var response = await _client.GetAsync("/api/review/non-existent-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion

  #region UpdateReview Tests

  /// <summary>
  /// 测试更新评论 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task UpdateReview_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Arrange
    var request = new UpdateReviewRequest
    {
      Rating = 4,
      Content = "Updated review content"
    };

    // Act
    var response = await _client.PutAsJsonAsync("/api/review/test-review-id", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试更新评论 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回更新后的评论信息
  /// </summary>
  [Fact]
  public async Task UpdateReview_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个评论
    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    var createResponse = await _client.PostAsJsonAsync("/api/review", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var reviewId = createApiResponse!.Data!.Id;

    // 准备更新请求
    var updateRequest = new UpdateReviewRequest
    {
      Rating = 4,
      Content = "Updated review content"
    };

    // Act
    var response = await _client.PutAsJsonAsync($"/api/review/{reviewId}", updateRequest);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Data.Should().NotBeNull();
    apiResponse.Data!.Rating.Should().Be(updateRequest.Rating);
    apiResponse.Data.Content.Should().Be(updateRequest.Content);
  }

  /// <summary>
  /// 测试更新评论 - 无效ID场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task UpdateReview_WithInvalidId_ReturnsNotFound()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    var request = new UpdateReviewRequest
    {
      Rating = 4,
      Content = "Updated review content"
    };

    // Act
    var response = await _client.PutAsJsonAsync("/api/review/non-existent-id", request);

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion

  #region DeleteReview Tests

  /// <summary>
  /// 测试删除评论 - 无认证场景
  /// 验证：
  /// - 返回401 Unauthorized状态码
  /// </summary>
  [Fact]
  public async Task DeleteReview_WithoutAuthentication_ReturnsUnauthorized()
  {
    // Act
    var response = await _client.DeleteAsync("/api/review/test-review-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
  }

  /// <summary>
  /// 测试删除评论 - 有认证场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 返回删除成功的消息
  /// </summary>
  [Fact]
  public async Task DeleteReview_WithAuthentication_ReturnsSuccess()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // 先创建一个评论
    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    var createResponse = await _client.PostAsJsonAsync("/api/review", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var reviewId = createApiResponse!.Data!.Id;

    // Act
    var response = await _client.DeleteAsync($"/api/review/{reviewId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Message.Should().Be("Review deleted successfully");
  }

  /// <summary>
  /// 测试删除评论 - 管理员身份场景
  /// 验证：
  /// - 返回200 OK状态码
  /// - 管理员可以删除任何评论
  /// </summary>
  [Fact]
  public async Task DeleteReview_AsAdmin_ReturnsSuccess()
  {
    // Arrange - 先用租客身份创建评论
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    var createRequest = new CreateReviewRequest
    {
      EquipmentId = _testEquipmentId,
      Rating = 5,
      Content = "Great equipment!"
    };
    var createResponse = await _client.PostAsJsonAsync("/api/review", createRequest);
    var createContent = await createResponse.Content.ReadAsStringAsync();
    var createApiResponse = JsonSerializer.Deserialize<ApiResponse<ReviewViewDto>>(createContent, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    var reviewId = createApiResponse!.Data!.Id;

    // 切换到管理员身份
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testAdminToken);

    // Act
    var response = await _client.DeleteAsync($"/api/review/{reviewId}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);

    var content = await response.Content.ReadAsStringAsync();
    var apiResponse = JsonSerializer.Deserialize<ApiResponse>(content, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    apiResponse!.Success.Should().BeTrue();
    apiResponse.Message.Should().Be("Review deleted successfully");
  }

  /// <summary>
  /// 测试删除评论 - 无效ID场景
  /// 验证：
  /// - 返回404 NotFound状态码
  /// </summary>
  [Fact]
  public async Task DeleteReview_WithInvalidId_ReturnsNotFound()
  {
    // Arrange
    _client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _testRenterToken);

    // Act
    var response = await _client.DeleteAsync("/api/review/non-existent-id");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
  }

  #endregion
}