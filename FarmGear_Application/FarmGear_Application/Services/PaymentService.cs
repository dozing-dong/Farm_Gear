using FarmGear_Application.Data;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Payment;
using FarmGear_Application.Models;
using FarmGear_Application.Interfaces.PaymentGateways;
using FarmGear_Application.Interfaces.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Services;

/// <summary>
/// Payment service implementation
/// </summary>
public class PaymentService : IPaymentService
{
  private readonly ApplicationDbContext _context;
  private readonly UserManager<AppUser> _userManager;
  private readonly ILogger<PaymentService> _logger;
  private readonly IAlipayService _alipay;

  public PaymentService(
      ApplicationDbContext context,
      UserManager<AppUser> userManager,
      ILogger<PaymentService> logger,
      IAlipayService alipay)
  {
    _context = context;
    _userManager = userManager;
    _logger = logger;
    _alipay = alipay;
  }

  /// <summary>
  /// Create payment intent, create payment record for accepted orders
  /// </summary>
  /// <param name="request">Create payment intent request</param>
  /// <param name="userId">User ID</param>
  /// <returns>Payment status response</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> CreatePaymentIntentAsync(CreatePaymentIntentRequest request, string userId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if user exists
      var user = await _userManager.FindByIdAsync(userId);
      if (user == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "User does not exist"
        };
      }

      // Check if order exists and belongs to current user
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .Include(o => o.Renter)
          .FirstOrDefaultAsync(o => o.Id == request.OrderId);

      if (order == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order does not exist"
        };
      }

      if (order.RenterId != userId)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No permission to pay for this order"
        };
      }

      // Verify if order status is accepted
      if (order.Status != OrderStatus.Accepted)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order is not in accepted status"
        };
      }

      // Check if payment record already exists
      var existingPayment = await _context.PaymentRecords
          .FirstOrDefaultAsync(p => p.OrderId == request.OrderId);

      if (existingPayment != null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Payment already exists for this order"
        };
      }

      // Verify order data integrity
      if (order.Equipment == null || order.Renter == null)
      {
        _logger.LogError("Order {OrderId} data is incomplete", request.OrderId);
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order data is incomplete"
        };
      }

      // Create payment record
      var paymentRecord = new PaymentRecord
      {
        OrderId = request.OrderId,
        UserId = userId,
        Amount = order.TotalAmount,
        Status = PaymentStatus.Pending,
        CreatedAt = DateTime.UtcNow
      };

      _context.PaymentRecords.Add(paymentRecord);
      await _context.SaveChangesAsync();

      // Generate Alipay payment URL
      var paymentUrl = _alipay.GeneratePaymentUrl(
          paymentRecord.Id,
          paymentRecord.Amount,
          $"FarmGear Order {order.Id}");

      await transaction.CommitAsync();

      var response = await MapToViewDtoAsync(paymentRecord);
      response.PaymentUrl = paymentUrl;

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Message = "Payment intent created successfully",
        Data = response
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error creating payment intent for order {OrderId}", request.OrderId);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while creating payment intent"
      };
    }
  }

  /// <summary>
  /// Get payment status of order
  /// </summary>
  /// <param name="orderId">Order ID</param>
  /// <param name="userId">User ID</param>
  /// <param name="isAdmin">Whether it's administrator</param>
  /// <returns>Payment status response</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> GetPaymentStatusAsync(string orderId, string userId, bool isAdmin)
  {
    try
    {
      // Check if order exists
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .FirstOrDefaultAsync(o => o.Id == orderId);

      if (order == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order does not exist"
        };
      }

      // Check permissions: Only order renter, equipment owner or administrator can view payment status
      if (!isAdmin && order.RenterId != userId && order.Equipment?.OwnerId != userId)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No permission to view payment status for this order"
        };
      }

      // Get payment record
      var paymentRecord = await _context.PaymentRecords
          .FirstOrDefaultAsync(p => p.OrderId == orderId);

      if (paymentRecord == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No payment record found for this order"
        };
      }

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Data = await MapToViewDtoAsync(paymentRecord)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting payment status for order {OrderId}", orderId);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while getting payment status"
      };
    }
  }

  /// <summary>
  /// 获取支付记录列表，支持分页和筛选
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <param name="userId">用户ID</param>
  /// <param name="isAdmin">是否为管理员</param>
  /// <returns>分页支付记录列表</returns>
  public async Task<ApiResponse<PaginatedList<PaymentStatusResponse>>> GetPaymentRecordsAsync(PaymentQueryParameters parameters, string userId, bool isAdmin)
  {
    try
    {
      var query = _context.PaymentRecords
          .Include(p => p.Order)
          .ThenInclude(o => o!.Equipment)
          .Include(p => p.Order)
          .ThenInclude(o => o!.Renter)
          .AsQueryable();

      // 应用权限过滤
      if (!isAdmin)
      {
        query = query.Where(p =>
            p.UserId == userId ||
            (p.Order != null && p.Order.Equipment != null && p.Order.Equipment.OwnerId == userId));
      }

      // 应用筛选条件
      query = ApplyFilters(query, parameters);

      // 应用排序
      query = ApplySorting(query, parameters);

      // 获取分页数据
      var paginatedList = await PaginatedList<PaymentRecord>.CreateAsync(
          query,
          parameters.PageNumber,
          parameters.PageSize);

      // 转换为视图 DTO
      var items = await Task.WhenAll(
          paginatedList.Items.Select(MapToViewDtoAsync));

      return new ApiResponse<PaginatedList<PaymentStatusResponse>>
      {
        Success = true,
        Data = new PaginatedList<PaymentStatusResponse>(
            items.ToList(),
            paginatedList.TotalCount,
            paginatedList.PageNumber,
            paginatedList.PageSize)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error retrieving payment records");
      return new ApiResponse<PaginatedList<PaymentStatusResponse>>
      {
        Success = false,
        Message = "An error occurred while retrieving payment records"
      };
    }
  }

  /// <summary>
  /// 根据ID获取支付记录详情
  /// </summary>
  /// <param name="id">支付记录ID</param>
  /// <param name="userId">用户ID</param>
  /// <param name="isAdmin">是否为管理员</param>
  /// <returns>支付记录详情</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> GetPaymentRecordByIdAsync(string id, string userId, bool isAdmin)
  {
    try
    {
      var paymentRecord = await _context.PaymentRecords
          .Include(p => p.Order)
          .ThenInclude(o => o!.Equipment)
          .Include(p => p.Order)
          .ThenInclude(o => o!.Renter)
          .FirstOrDefaultAsync(p => p.Id == id);

      if (paymentRecord == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Payment record not found"
        };
      }

      // 检查权限：只有支付用户、设备所有者或管理员可以查看支付记录
      if (!isAdmin &&
          paymentRecord.UserId != userId &&
          paymentRecord.Order?.Equipment?.OwnerId != userId)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "You are not authorized to view this payment record"
        };
      }

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Data = await MapToViewDtoAsync(paymentRecord)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error retrieving payment record details: {PaymentId}", id);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while retrieving payment record details"
      };
    }
  }

  /// <summary>
  /// 完成支付，更新支付记录和订单状态
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> CompletePaymentAsync(string orderId, string userId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if order exists且属于当前用户
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .FirstOrDefaultAsync(o => o.Id == orderId);

      if (order == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order does not exist"
        };
      }

      if (order.RenterId != userId)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No permission to complete payment for this order"
        };
      }

      // Get payment record
      var paymentRecord = await _context.PaymentRecords
          .FirstOrDefaultAsync(p => p.OrderId == orderId);

      if (paymentRecord == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No payment record found for this order"
        };
      }

      if (paymentRecord.Status != PaymentStatus.Pending)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Payment is not in pending status"
        };
      }

      // 更新支付记录
      paymentRecord.Status = PaymentStatus.Paid;
      paymentRecord.PaidAt = DateTime.UtcNow;

      // 更新订单状态 - 重构版本：根据开始时间智能决定状态
      var currentTime = DateTime.UtcNow;
      if (order.StartDate <= currentTime)
      {
        // 租期已开始，订单进入进行中状态
        order.Status = OrderStatus.InProgress;
        if (order.Equipment != null)
        {
          order.Equipment.Status = EquipmentStatus.Rented;
        }
      }
      else
      {
        // 租期未开始，保持已接受状态，等待系统自动启动
        order.Status = OrderStatus.Accepted;
      }
      order.UpdatedAt = currentTime;

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Message = "Payment completed successfully",
        Data = await MapToViewDtoAsync(paymentRecord)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error completing payment for order {OrderId}", orderId);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while completing payment"
      };
    }
  }

  /// <summary>
  /// 取消支付，更新支付记录状态
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> CancelPaymentAsync(string orderId, string userId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if order exists且属于当前用户
      var order = await _context.Orders
          .FirstOrDefaultAsync(o => o.Id == orderId);

      if (order == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order does not exist"
        };
      }

      if (order.RenterId != userId)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No permission to cancel payment for this order"
        };
      }

      // Get payment record
      var paymentRecord = await _context.PaymentRecords
          .FirstOrDefaultAsync(p => p.OrderId == orderId);

      if (paymentRecord == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No payment record found for this order"
        };
      }

      // 检查支付状态是否允许取消
      if (paymentRecord.Status != PaymentStatus.Pending)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Payment cannot be cancelled"
        };
      }

      // 更新支付记录状态
      paymentRecord.Status = PaymentStatus.Cancelled;

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Message = "Payment cancelled successfully",
        Data = await MapToViewDtoAsync(paymentRecord)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error cancelling payment for order {OrderId}", orderId);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while cancelling payment"
      };
    }
  }

  /// <summary>
  /// 标记支付为成功，用于支付宝回调处理
  /// </summary>
  /// <param name="paymentId">支付记录ID</param>
  /// <returns>支付状态响应</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> MarkPaymentAsSucceededAsync(string paymentId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      var paymentRecord = await _context.PaymentRecords
          .Include(p => p.Order)
          .ThenInclude(o => o!.Equipment)
          .FirstOrDefaultAsync(p => p.Id == paymentId);

      if (paymentRecord == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Payment record not found"
        };
      }

      // 幂等性检查：如果已经是已支付状态，直接返回成功
      if (paymentRecord.Status == PaymentStatus.Paid)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = true,
          Message = "Payment already completed",
          Data = await MapToViewDtoAsync(paymentRecord)
        };
      }

      // 更新支付记录
      paymentRecord.Status = PaymentStatus.Paid;
      paymentRecord.PaidAt = DateTime.UtcNow;

      // 更新订单状态
      if (paymentRecord.Order != null)
      {
        paymentRecord.Order.Status = OrderStatus.Completed;
        paymentRecord.Order.UpdatedAt = DateTime.UtcNow;
      }

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Message = "Payment marked as succeeded",
        Data = await MapToViewDtoAsync(paymentRecord)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error marking payment as succeeded: {PaymentId}", paymentId);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while marking payment as succeeded"
      };
    }
  }

  /// <summary>
  /// 应用筛选条件到查询
  /// </summary>
  /// <param name="query">查询对象</param>
  /// <param name="parameters">查询参数</param>
  /// <returns>应用筛选后的查询</returns>
  private static IQueryable<PaymentRecord> ApplyFilters(IQueryable<PaymentRecord> query, PaymentQueryParameters parameters)
  {
    if (!string.IsNullOrWhiteSpace(parameters.OrderId))
    {
      query = query.Where(p => p.OrderId == parameters.OrderId);
    }

    if (!string.IsNullOrWhiteSpace(parameters.UserId))
    {
      query = query.Where(p => p.UserId == parameters.UserId);
    }

    if (parameters.Status.HasValue)
    {
      query = query.Where(p => p.Status == parameters.Status.Value);
    }

    if (parameters.MinAmount.HasValue)
    {
      query = query.Where(p => p.Amount >= parameters.MinAmount.Value);
    }

    if (parameters.MaxAmount.HasValue)
    {
      query = query.Where(p => p.Amount <= parameters.MaxAmount.Value);
    }

    if (parameters.StartDate.HasValue)
    {
      query = query.Where(p => p.CreatedAt >= parameters.StartDate.Value);
    }

    if (parameters.EndDate.HasValue)
    {
      query = query.Where(p => p.CreatedAt <= parameters.EndDate.Value);
    }

    if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
    {
      var searchTerm = parameters.SearchTerm.ToLower();
      query = query.Where(p =>
          p.OrderId.ToLower().Contains(searchTerm) ||
          (p.Order != null && p.Order.Equipment != null && p.Order.Equipment.Name.ToLower().Contains(searchTerm)));
    }

    return query;
  }

  /// <summary>
  /// 应用排序到查询
  /// </summary>
  /// <param name="query">查询对象</param>
  /// <param name="parameters">查询参数</param>
  /// <returns>应用排序后的查询</returns>
  private static IQueryable<PaymentRecord> ApplySorting(IQueryable<PaymentRecord> query, PaymentQueryParameters parameters)
  {
    return parameters.SortBy?.ToLower() switch
    {
      "amount" => parameters.IsAscending
          ? query.OrderBy(p => p.Amount)
          : query.OrderByDescending(p => p.Amount),
      "status" => parameters.IsAscending
          ? query.OrderBy(p => p.Status)
          : query.OrderByDescending(p => p.Status),
      "createdat" => parameters.IsAscending
          ? query.OrderBy(p => p.CreatedAt)
          : query.OrderByDescending(p => p.CreatedAt),
      "paidat" => parameters.IsAscending
          ? query.OrderBy(p => p.PaidAt)
          : query.OrderByDescending(p => p.PaidAt),
      _ => query.OrderByDescending(p => p.CreatedAt)
    };
  }

  /// <summary>
  /// 将支付记录映射为视图DTO
  /// </summary>
  /// <param name="paymentRecord">支付记录</param>
  /// <returns>支付状态响应DTO</returns>
  private async Task<PaymentStatusResponse> MapToViewDtoAsync(PaymentRecord paymentRecord)
  {
    var user = await _userManager.FindByIdAsync(paymentRecord.UserId);

    return new PaymentStatusResponse
    {
      Id = paymentRecord.Id,
      OrderId = paymentRecord.OrderId,
      Amount = paymentRecord.Amount,
      Status = paymentRecord.Status,
      PaidAt = paymentRecord.PaidAt,
      CreatedAt = paymentRecord.CreatedAt,
      UserId = paymentRecord.UserId,
      UserName = user?.UserName ?? string.Empty
    };
  }

  /// <summary>
  /// 处理模拟支付 - 开发测试专用
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  public async Task<ApiResponse<PaymentStatusResponse>> ProcessMockPaymentAsync(string orderId, string userId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if order exists且属于当前用户
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .Include(o => o.Renter)
          .FirstOrDefaultAsync(o => o.Id == orderId);

      if (order == null)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order does not exist"
        };
      }

      if (order.RenterId != userId)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "No permission to pay for this order"
        };
      }

      // Verify if order status is accepted
      if (order.Status != OrderStatus.Accepted)
      {
        return new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Order is not in accepted status"
        };
      }

      // 检查是否已有支付记录
      var existingPayment = await _context.PaymentRecords
          .FirstOrDefaultAsync(p => p.OrderId == orderId);

      PaymentRecord paymentRecord;

      if (existingPayment == null)
      {
        // 创建新的支付记录（直接标记为已支付）
        paymentRecord = new PaymentRecord
        {
          OrderId = orderId,
          UserId = userId,
          Amount = order.TotalAmount,
          Status = PaymentStatus.Paid,
          CreatedAt = DateTime.UtcNow,
          PaidAt = DateTime.UtcNow
        };

        _context.PaymentRecords.Add(paymentRecord);
      }
      else
      {
        // 更新现有支付记录
        paymentRecord = existingPayment;
        paymentRecord.Status = PaymentStatus.Paid;
        paymentRecord.PaidAt = DateTime.UtcNow;
      }

      // 更新订单状态 - 支付完成后立即进入进行中状态
      var currentTime = DateTime.UtcNow;
      order.Status = OrderStatus.InProgress;
      if (order.Equipment != null)
      {
        order.Equipment.Status = EquipmentStatus.Rented;
      }
      order.UpdatedAt = currentTime;

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<PaymentStatusResponse>
      {
        Success = true,
        Message = "Mock payment completed successfully",
        Data = await MapToViewDtoAsync(paymentRecord)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error processing mock payment for order {OrderId}", orderId);
      return new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while processing the mock payment"
      };
    }
  }
}