using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Equipment;
using FarmGear_Application.DTOs.Orders;
using FarmGear_Application.DTOs.Payment;
using FarmGear_Application.DTOs.Reviews;
using FarmGear_Application.Models;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Tests.Helpers;

/// <summary>
/// 测试数据工厂类
/// </summary>
public static class TestDataFactory
{
  #region Equipment Factory Methods

  /// <summary>
  /// 创建测试用的CreateEquipmentRequest
  /// </summary>
  public static CreateEquipmentRequest CreateEquipmentRequest(
      string name = "Test Equipment",
      string description = "Test Description",
      decimal dailyPrice = 100.00m,
      double latitude = 39.9042,
      double longitude = 116.4074,
      string type = "Tractor")
  {
    return new CreateEquipmentRequest
    {
      Name = name,
      Description = description,
      DailyPrice = dailyPrice,
      Latitude = latitude,
      Longitude = longitude,
      Type = type
    };
  }

  /// <summary>
  /// 创建测试用的UpdateEquipmentRequest
  /// </summary>
  public static UpdateEquipmentRequest CreateUpdateEquipmentRequest(
      string name = "Updated Equipment",
      string description = "Updated Description",
      decimal dailyPrice = 150.00m,
      double latitude = 39.9042,
      double longitude = 116.4074,
      EquipmentStatus status = EquipmentStatus.Available,
      string type = "Updated Tractor")
  {
    return new UpdateEquipmentRequest
    {
      Name = name,
      Description = description,
      DailyPrice = dailyPrice,
      Latitude = latitude,
      Longitude = longitude,
      Status = status,
      Type = type
    };
  }

  /// <summary>
  /// 创建测试用的EquipmentViewDto
  /// </summary>
  public static EquipmentViewDto CreateEquipmentViewDto(
      string id = "test-equipment-id",
      string name = "Test Equipment",
      string description = "Test Description",
      decimal dailyPrice = 100.00m,
      double latitude = 39.9042,
      double longitude = 116.4074,
      EquipmentStatus status = EquipmentStatus.Available,
      string ownerId = "test-owner-id",
      string ownerUsername = "testuser",
      string type = "Tractor")
  {
    return new EquipmentViewDto
    {
      Id = id,
      Name = name,
      Description = description,
      DailyPrice = dailyPrice,
      Latitude = latitude,
      Longitude = longitude,
      Status = status,
      OwnerId = ownerId,
      OwnerUsername = ownerUsername,
      Type = type,
      CreatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// 创建测试用的EquipmentQueryParameters
  /// </summary>
  public static EquipmentQueryParameters CreateEquipmentQueryParameters(
      int page = 1,
      int pageSize = 10,
      string? searchTerm = null,
      EquipmentStatus? status = null,
      string? type = null,
      decimal? minPrice = null,
      decimal? maxPrice = null)
  {
    return new EquipmentQueryParameters
    {
      PageNumber = page,
      PageSize = pageSize,
      SearchTerm = searchTerm,
      Status = status,
      MinDailyPrice = minPrice,
      MaxDailyPrice = maxPrice
    };
  }

  #endregion

  #region Order Factory Methods

  /// <summary>
  /// 创建测试用的CreateOrderRequest
  /// </summary>
  public static CreateOrderRequest CreateOrderRequest(
      string equipmentId = "test-equipment-id",
      DateTime? startDate = null,
      DateTime? endDate = null)
  {
    return new CreateOrderRequest
    {
      EquipmentId = equipmentId,
      StartDate = startDate ?? DateTime.UtcNow.AddDays(1),
      EndDate = endDate ?? DateTime.UtcNow.AddDays(3)
    };
  }

  /// <summary>
  /// 创建测试用的OrderViewDto
  /// </summary>
  public static OrderViewDto CreateOrderViewDto(
      string id = "test-order-id",
      string equipmentId = "test-equipment-id",
      string equipmentName = "Test Equipment",
      string renterId = "test-renter-id",
      string renterName = "Test Renter",
      DateTime? startDate = null,
      DateTime? endDate = null,
      decimal totalAmount = 200.00m,
      OrderStatus status = OrderStatus.Pending)
  {
    return new OrderViewDto
    {
      Id = id,
      EquipmentId = equipmentId,
      EquipmentName = equipmentName,
      RenterId = renterId,
      RenterName = renterName,
      StartDate = startDate ?? DateTime.UtcNow.AddDays(1),
      EndDate = endDate ?? DateTime.UtcNow.AddDays(3),
      TotalAmount = totalAmount,
      Status = status,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// 创建测试用的OrderQueryParameters
  /// </summary>
  public static OrderQueryParameters CreateOrderQueryParameters(
      int page = 1,
      int pageSize = 10,
      OrderStatus? status = null,
      string? equipmentId = null,
      DateTime? startDateFrom = null,
      DateTime? startDateTo = null,
      DateTime? endDateFrom = null,
      DateTime? endDateTo = null,
      decimal? minTotalAmount = null,
      decimal? maxTotalAmount = null,
      string? sortBy = null,
      bool isAscending = true)
  {
    return new OrderQueryParameters
    {
      PageNumber = page,
      PageSize = pageSize,
      Status = status,
      EquipmentId = equipmentId,
      StartDateFrom = startDateFrom,
      StartDateTo = startDateTo,
      EndDateFrom = endDateFrom,
      EndDateTo = endDateTo,
      MinTotalAmount = minTotalAmount,
      MaxTotalAmount = maxTotalAmount,
      SortBy = sortBy,
      IsAscending = isAscending
    };
  }

  #endregion

  #region Payment Factory Methods

  /// <summary>
  /// 创建测试用的CreatePaymentIntentRequest
  /// </summary>
  public static CreatePaymentIntentRequest CreatePaymentIntentRequest(
      string orderId = "test-order-id")
  {
    return new CreatePaymentIntentRequest
    {
      OrderId = orderId
    };
  }

  /// <summary>
  /// 创建测试用的PaymentStatusResponse
  /// </summary>
  public static PaymentStatusResponse CreatePaymentStatusResponse(
      string id = "test-payment-id",
      string orderId = "test-order-id",
      decimal amount = 100.00m,
      PaymentStatus status = PaymentStatus.Pending,
      string? paymentUrl = null,
      string userId = "test-user-id",
      string userName = "testuser")
  {
    return new PaymentStatusResponse
    {
      Id = id,
      OrderId = orderId,
      Amount = amount,
      Status = status,
      PaymentUrl = paymentUrl,
      UserId = userId,
      UserName = userName,
      CreatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// 创建测试用的PaymentQueryParameters
  /// </summary>
  public static PaymentQueryParameters CreatePaymentQueryParameters(
      int page = 1,
      int pageSize = 10,
      string? orderId = null,
      string? userId = null,
      PaymentStatus? status = null,
      decimal? minAmount = null,
      decimal? maxAmount = null,
      DateTime? startDate = null,
      DateTime? endDate = null,
      string? searchTerm = null,
      string? sortBy = null,
      bool isAscending = true)
  {
    return new PaymentQueryParameters
    {
      PageNumber = page,
      PageSize = pageSize,
      OrderId = orderId,
      UserId = userId,
      Status = status,
      MinAmount = minAmount,
      MaxAmount = maxAmount,
      StartDate = startDate,
      EndDate = endDate,
      SearchTerm = searchTerm,
      SortBy = sortBy,
      IsAscending = isAscending
    };
  }

  #endregion

  #region Review Factory Methods

  /// <summary>
  /// 创建测试用的CreateReviewRequest
  /// </summary>
  public static CreateReviewRequest CreateReviewRequest(
      string equipmentId = "test-equipment-id",
      int rating = 5,
      string content = "Great equipment!")
  {
    return new CreateReviewRequest
    {
      EquipmentId = equipmentId,
      Rating = rating,
      Content = content
    };
  }

  /// <summary>
  /// 创建测试用的UpdateReviewRequest
  /// </summary>
  public static UpdateReviewRequest CreateUpdateReviewRequest(
      int rating = 4,
      string content = "Updated review content")
  {
    return new UpdateReviewRequest
    {
      Rating = rating,
      Content = content
    };
  }

  /// <summary>
  /// 创建测试用的ReviewViewDto
  /// </summary>
  public static ReviewViewDto CreateReviewViewDto(
      string id = "test-review-id",
      string equipmentId = "test-equipment-id",
      string equipmentName = "Test Equipment",
      string orderId = "test-order-id",
      string userId = "test-user-id",
      string userName = "testuser",
      int rating = 5,
      string content = "Great equipment!")
  {
    return new ReviewViewDto
    {
      Id = id,
      EquipmentId = equipmentId,
      EquipmentName = equipmentName,
      OrderId = orderId,
      UserId = userId,
      UserName = userName,
      Rating = rating,
      Content = content,
      CreatedAt = DateTime.UtcNow,
      UpdatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// 创建测试用的ReviewQueryParameters
  /// </summary>
  public static ReviewQueryParameters CreateReviewQueryParameters(
      int page = 1,
      int pageSize = 10,
      string? equipmentId = null,
      string? userId = null,
      int? minRating = null,
      int? maxRating = null,
      DateTime? startDate = null,
      DateTime? endDate = null,
      string? sortBy = null,
      bool isAscending = true)
  {
    return new ReviewQueryParameters
    {
      PageNumber = page,
      PageSize = pageSize,
      EquipmentId = equipmentId,
      UserId = userId,
      MinRating = minRating,
      MaxRating = maxRating,
      StartDate = startDate,
      EndDate = endDate,
      SortBy = sortBy,
      IsAscending = isAscending
    };
  }

  #endregion

  #region Common Factory Methods

  /// <summary>
  /// 创建成功的ApiResponse
  /// </summary>
  public static ApiResponse<T> CreateSuccessResponse<T>(T data, string message = "Success")
  {
    return new ApiResponse<T>
    {
      Success = true,
      Data = data,
      Message = message
    };
  }

  /// <summary>
  /// 创建失败的ApiResponse
  /// </summary>
  public static ApiResponse<T> CreateErrorResponse<T>(string message, T? data = default)
  {
    return new ApiResponse<T>
    {
      Success = false,
      Data = data,
      Message = message
    };
  }

  /// <summary>
  /// 创建成功的ApiResponse（无数据）
  /// </summary>
  public static ApiResponse CreateSuccessResponse(string message = "Success")
  {
    return new ApiResponse
    {
      Success = true,
      Message = message
    };
  }

  /// <summary>
  /// 创建失败的ApiResponse（无数据）
  /// </summary>
  public static ApiResponse CreateErrorResponse(string message)
  {
    return new ApiResponse
    {
      Success = false,
      Message = message
    };
  }

  /// <summary>
  /// 创建分页列表
  /// </summary>
  public static PaginatedList<T> CreatePaginatedList<T>(
      IEnumerable<T> items,
      int totalCount,
      int page = 1,
      int pageSize = 10)
  {
    return new PaginatedList<T>(items.ToList(), totalCount, page, pageSize);
  }

  #endregion
}