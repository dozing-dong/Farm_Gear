using FarmGear_Application.Data;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Orders;
using FarmGear_Application.Models;
using FarmGear_Application.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FarmGear_Application.Interfaces.Services;

namespace FarmGear_Application.Services;

/// <summary>
/// Order service implementation
/// </summary>
public class OrderService : IOrderService
{
  private readonly ApplicationDbContext _context;
  private readonly UserManager<AppUser> _userManager;
  private readonly ILogger<OrderService> _logger;

  public OrderService(
      ApplicationDbContext context,
      UserManager<AppUser> userManager,
      ILogger<OrderService> logger)
  {
    _context = context;
    _userManager = userManager;
    _logger = logger;
  }

  /// <inheritdoc/>
  // This method is used to create orders, requires providing create order request and renter ID
  public async Task<ApiResponse<OrderViewDto>> CreateOrderAsync(CreateOrderRequest request, string renterId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if user exists
      var renter = await _userManager.FindByIdAsync(renterId);
      if (renter == null)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "User does not exist"
        };
      }

      // Verify if equipment exists and is available
      var equipment = await _context.Equipment
          .Include(e => e.Owner)
          .FirstOrDefaultAsync(e => e.Id == request.EquipmentId);

      if (equipment == null)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Equipment not found"
        };
      }

      if (equipment.Status != EquipmentStatus.Available)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Equipment is not available"
        };
      }

      // 验证用户不能租用自己的设备
      if (equipment.OwnerId == renterId)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Cannot rent your own equipment"
        };
      }

      // 验证日期范围
      if (request.StartDate < DateTime.UtcNow.Date)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Start date cannot be in the past"
        };
      }

      if (request.EndDate <= request.StartDate)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "End date must be after start date"
        };
      }

      // 检查设备在指定时间段是否可用
      var isAvailable = await IsEquipmentAvailableAsync(request.EquipmentId, request.StartDate, request.EndDate);
      if (!isAvailable)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Equipment is not available for the selected dates"
        };
      }

      // 计算总金额
      var days = (request.EndDate - request.StartDate).Days;
      if (days <= 0)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Invalid date range"
        };
      }

      var totalAmount = equipment.DailyPrice * days;

      // 创建订单
      var order = new Order
      {
        EquipmentId = request.EquipmentId,
        RenterId = renterId,
        StartDate = request.StartDate,
        EndDate = request.EndDate,
        TotalAmount = totalAmount,
        Status = OrderStatus.Pending,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
      };

      _context.Orders.Add(order);
      // Lock equipment immediately during approval phase to prevent double-booking
      equipment.Status = EquipmentStatus.Rented;
      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      // 返回创建的订单
      return new ApiResponse<OrderViewDto>
      {
        Success = true,
        Message = "Order created successfully",
        Data = await MapToViewDtoAsync(order)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error creating order for equipment {EquipmentId}", request.EquipmentId);
      return new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while creating the order"
      };
    }
  }

  /// <inheritdoc/>
  /// 这个方法用于根据订单ID获取订单详情，需要提供订单ID、用户ID和是否为管理员
  public async Task<ApiResponse<OrderViewDto>> GetOrderByIdAsync(string id, string userId, bool isAdmin)
  {
    try
    {
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .Include(o => o.Renter)
          .FirstOrDefaultAsync(o => o.Id == id);

      if (order == null)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order not found"
        };
      }

      // 检查权限：只有订单的租客、设备所有者或管理员可以查看订单
      if (!isAdmin && order.RenterId != userId && order.Equipment?.OwnerId != userId)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "You are not authorized to view this order"
        };
      }

      // 验证订单数据完整性
      if (order.Equipment == null || order.Renter == null)
      {
        _logger.LogError("Order {OrderId} data is incomplete", id);
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order data is incomplete"
        };
      }

      return new ApiResponse<OrderViewDto>
      {
        Success = true,
        Data = await MapToViewDtoAsync(order)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting order {OrderId}", id);
      return new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while getting the order"
      };
    }
  }

  /// <inheritdoc/>
  /// 这个方法用于获取订单列表，需要提供查询参数、用户ID和是否为管理员
  public async Task<ApiResponse<PaginatedList<OrderViewDto>>> GetOrdersAsync(OrderQueryParameters parameters, string userId, bool isAdmin)
  {
    try
    {
      // 构建基础查询
      var query = _context.Orders
          .Include(o => o.Equipment)
          .Include(o => o.Renter)
          .AsQueryable();

      // 如果不是管理员，只能查看自己的订单（作为租客或设备所有者）
      if (!isAdmin)
      {
        query = query.Where(o => o.RenterId == userId || o.Equipment!.OwnerId == userId);
      }

      // 应用筛选条件
      query = ApplyFilters(query, parameters);

      // 应用排序
      query = ApplySorting(query, parameters);

      // 获取分页数据
      var paginatedList = await PaginatedList<Order>.CreateAsync(
          query,
          parameters.PageNumber,
          parameters.PageSize);

      // 转换为视图 DTO
      var items = await Task.WhenAll(
          paginatedList.Items.Select(MapToViewDtoAsync));

      return new ApiResponse<PaginatedList<OrderViewDto>>
      {
        Success = true,
        Data = new PaginatedList<OrderViewDto>(
            items.ToList(),
            paginatedList.TotalCount,
            paginatedList.PageNumber,
            paginatedList.PageSize)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting orders for user {UserId}", userId);
      return new ApiResponse<PaginatedList<OrderViewDto>>
      {
        Success = false,
        Message = "An error occurred while getting the orders"
      };
    }
  }

  /// <inheritdoc/>
  /// 这个方法用于更新订单状态，需要提供订单ID、新的状态、用户ID和是否为管理员
  public async Task<ApiResponse<OrderViewDto>> UpdateOrderStatusAsync(string id, OrderStatus status, string userId, bool isAdmin)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .Include(o => o.Renter)
          .FirstOrDefaultAsync(o => o.Id == id);

      if (order == null)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order not found"
        };
      }

      // 验证订单数据完整性
      if (order.Equipment == null)
      {
        _logger.LogError("Order {OrderId} data is incomplete", id);
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order data is incomplete"
        };
      }

      // 检查权限：只有设备所有者或管理员可以更新订单状态
      if (!isAdmin && order.Equipment.OwnerId != userId)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "You are not authorized to update this order"
        };
      }

      // 验证状态转换是否合法
      var validationResult = ValidateStatusTransition(order.Status, status);
      if (!validationResult.IsValid)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = validationResult.Message
        };
      }

      // 更新订单状态
      order.Status = status;
      order.UpdatedAt = DateTime.UtcNow;

      // 根据新状态更新设备状态
      UpdateEquipmentStatus(order, status);

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      // 返回更新后的订单
      return new ApiResponse<OrderViewDto>
      {
        Success = true,
        Message = "Order status updated successfully",
        Data = await MapToViewDtoAsync(order)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error updating order {OrderId} status", id);
      return new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while updating the order status"
      };
    }
  }

  /// <inheritdoc/>
  /// 这个方法用于取消订单，需要提供订单ID、用户ID和是否为管理员
  public async Task<ApiResponse<OrderViewDto>> CancelOrderAsync(string id, string userId, bool isAdmin)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      var order = await _context.Orders
          .Include(o => o.Equipment)
          .Include(o => o.Renter)
          .FirstOrDefaultAsync(o => o.Id == id);

      if (order == null)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order not found"
        };
      }

      // 验证订单数据完整性
      if (order.Equipment == null)
      {
        _logger.LogError("Order {OrderId} data is incomplete", id);
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order data is incomplete"
        };
      }

      // 检查权限：只有订单的租客、设备所有者或管理员可以取消订单
      if (!isAdmin && order.RenterId != userId && order.Equipment.OwnerId != userId)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "You are not authorized to cancel this order"
        };
      }

      // Validate whether the order can be cancelled
      var canCancel = order.Status switch
      {
        OrderStatus.Pending => true,
        OrderStatus.Accepted => true,
        _ => false
      };

      if (!canCancel)
      {
        return new ApiResponse<OrderViewDto>
        {
          Success = false,
          Message = "Order cannot be cancelled"
        };
      }

      // Track whether equipment is currently locked by this order
      var wasActiveBeforeCancel = order.Status == OrderStatus.Accepted || order.Status == OrderStatus.Pending;

      // 更新订单状态
      order.Status = OrderStatus.Cancelled;
      order.UpdatedAt = DateTime.UtcNow;

      // If order was locking the equipment, release it when no other active orders exist
      if (wasActiveBeforeCancel && order.Equipment != null)
      {
        var hasOtherActiveOrders = await _context.Orders.AnyAsync(o =>
          o.Id != order.Id &&
          o.EquipmentId == order.EquipmentId &&
          (o.Status == OrderStatus.Pending || o.Status == OrderStatus.Accepted || o.Status == OrderStatus.InProgress));

        if (!hasOtherActiveOrders)
        {
          order.Equipment.Status = EquipmentStatus.Available;
        }
      }

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<OrderViewDto>
      {
        Success = true,
        Message = "Order cancelled successfully",
        Data = await MapToViewDtoAsync(order)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error cancelling order {OrderId}", id);
      return new ApiResponse<OrderViewDto>
      {
        Success = false,
        Message = "An error occurred while cancelling the order"
      };
    }
  }

  /// <inheritdoc/>
  /// 这个方法用于检查设备在指定时间段是否可用
  public async Task<bool> IsEquipmentAvailableAsync(string equipmentId, DateTime startDate, DateTime endDate)
  {
    try
    {
      // 检查设备是否存在
      var equipment = await _context.Equipment
          .FirstOrDefaultAsync(e => e.Id == equipmentId);

      if (equipment == null)
      {
        return false;
      }

      // 如果设备处于维护中或已下架状态，不可用
      if (equipment.Status == EquipmentStatus.Maintenance || equipment.Status == EquipmentStatus.Offline)
      {
        return false;
      }

      // Check whether there are any other active orders overlapping with the requested period
      var hasOverlappingOrder = await _context.Orders
          .AnyAsync(o => o.EquipmentId == equipmentId
              && (o.Status == OrderStatus.Pending || o.Status == OrderStatus.Accepted || o.Status == OrderStatus.InProgress)
              && ((o.StartDate <= startDate && o.EndDate > startDate)
                  || (o.StartDate < endDate && o.EndDate >= endDate)
                  || (o.StartDate >= startDate && o.EndDate <= endDate)));

      return !hasOverlappingOrder;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error checking equipment {EquipmentId} availability", equipmentId);
      return false;
    }
  }

  /// <summary>
  /// 应用筛选条件到查询
  /// </summary>
  /// <param name="query">基础查询</param>
  /// <param name="parameters">查询参数</param>
  /// <returns>应用筛选后的查询</returns>
  private static IQueryable<Order> ApplyFilters(IQueryable<Order> query, OrderQueryParameters parameters)
  {
    if (parameters.Status.HasValue)
    {
      query = query.Where(o => o.Status == parameters.Status.Value);
    }

    if (parameters.StartDateFrom.HasValue)
    {
      query = query.Where(o => o.StartDate >= parameters.StartDateFrom.Value);
    }

    if (parameters.StartDateTo.HasValue)
    {
      query = query.Where(o => o.StartDate <= parameters.StartDateTo.Value);
    }

    if (parameters.EndDateFrom.HasValue)
    {
      query = query.Where(o => o.EndDate >= parameters.EndDateFrom.Value);
    }

    if (parameters.EndDateTo.HasValue)
    {
      query = query.Where(o => o.EndDate <= parameters.EndDateTo.Value);
    }

    if (parameters.MinTotalAmount.HasValue)
    {
      query = query.Where(o => o.TotalAmount >= parameters.MinTotalAmount.Value);
    }

    if (parameters.MaxTotalAmount.HasValue)
    {
      query = query.Where(o => o.TotalAmount <= parameters.MaxTotalAmount.Value);
    }

    if (!string.IsNullOrWhiteSpace(parameters.EquipmentId))
    {
      query = query.Where(o => o.EquipmentId == parameters.EquipmentId);
    }

    return query;
  }

  /// <summary>
  /// 应用排序到查询
  /// </summary>
  /// <param name="query">基础查询</param>
  /// <param name="parameters">查询参数</param>
  /// <returns>应用排序后的查询</returns>
  private static IQueryable<Order> ApplySorting(IQueryable<Order> query, OrderQueryParameters parameters)
  {
    return parameters.SortBy?.ToLower() switch
    {
      "createdat" => parameters.IsAscending
          ? query.OrderBy(o => o.CreatedAt)
          : query.OrderByDescending(o => o.CreatedAt),
      "startdate" => parameters.IsAscending
          ? query.OrderBy(o => o.StartDate)
          : query.OrderByDescending(o => o.StartDate),
      "enddate" => parameters.IsAscending
          ? query.OrderBy(o => o.EndDate)
          : query.OrderByDescending(o => o.EndDate),
      "totalamount" => parameters.IsAscending
          ? query.OrderBy(o => o.TotalAmount)
          : query.OrderByDescending(o => o.TotalAmount),
      "status" => parameters.IsAscending
          ? query.OrderBy(o => o.Status)
          : query.OrderByDescending(o => o.Status),
      _ => query.OrderByDescending(o => o.CreatedAt)
    };
  }

  /// <summary>
  /// 根据订单状态更新设备状态 - 重构版本
  /// 新设计：订单状态与设备状态分离，设备状态反映真实的使用情况
  /// </summary>
  /// <param name="order">订单对象</param>
  /// <param name="newStatus">新的订单状态</param>
  private static void UpdateEquipmentStatus(Order order, OrderStatus newStatus)
  {
    if (order.Equipment == null) return;

    order.Equipment.Status = newStatus switch
    {
      // 订单被接受时，设备变为已租出（锁定设备，防止重复下单）
      OrderStatus.Accepted => EquipmentStatus.Rented,

      // 订单进行中时，设备保持已租出状态
      OrderStatus.InProgress => EquipmentStatus.Rented,

      // 订单完成时，设备变为待归还（需要Provider确认收回）
      OrderStatus.Completed => EquipmentStatus.PendingReturn,

      // 订单被拒绝或取消时，设备恢复可用
      OrderStatus.Rejected => EquipmentStatus.Available,
      OrderStatus.Cancelled => EquipmentStatus.Available,

      _ => order.Equipment.Status
    };
  }

  /// <summary>
  /// 验证订单状态转换是否合法 - 重构版本
  /// 新的状态流转：Pending -> Accepted -> InProgress -> Completed
  /// </summary>
  /// <param name="currentStatus">当前状态</param>
  /// <param name="newStatus">新状态</param>
  /// <returns>验证结果</returns>
  private static (bool IsValid, string Message) ValidateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
  {
    var isValid = (currentStatus, newStatus) switch
    {
      // 待处理订单可以转换为已接受或已拒绝
      (OrderStatus.Pending, OrderStatus.Accepted) => true,
      (OrderStatus.Pending, OrderStatus.Rejected) => true,

      // 已接受订单可以转换为进行中或已取消
      (OrderStatus.Accepted, OrderStatus.InProgress) => true,
      (OrderStatus.Accepted, OrderStatus.Cancelled) => true,

      // 进行中订单只能转换为已完成（由系统自动处理）
      (OrderStatus.InProgress, OrderStatus.Completed) => true,

      // 最终状态不能再转换
      (OrderStatus.Completed, _) => false,
      (OrderStatus.Rejected, _) => false,
      (OrderStatus.Cancelled, _) => false,

      // 其他转换都是不合法的
      _ => false
    };

    return isValid
        ? (true, string.Empty)
        : (false, $"Invalid status transition from {currentStatus} to {newStatus}");
  }

  /// <summary>
  /// 将订单实体映射为视图DTO
  /// </summary>
  /// <param name="order">订单实体</param>
  /// <returns>订单视图DTO</returns>
  private async Task<OrderViewDto> MapToViewDtoAsync(Order order)
  {
    // 确保关联数据已加载
    if (order.Equipment == null)
    {
      await _context.Entry(order)
          .Reference(o => o.Equipment)
          .LoadAsync();
    }

    if (order.Renter == null)
    {
      await _context.Entry(order)
          .Reference(o => o.Renter)
          .LoadAsync();
    }

    return new OrderViewDto
    {
      Id = order.Id,
      EquipmentId = order.EquipmentId,
      EquipmentName = order.Equipment?.Name ?? string.Empty,
      RenterId = order.RenterId,
      RenterName = order.Renter?.UserName ?? string.Empty,
      StartDate = order.StartDate,
      EndDate = order.EndDate,
      TotalAmount = order.TotalAmount,
      Status = order.Status,
      CreatedAt = order.CreatedAt,
      UpdatedAt = order.UpdatedAt
    };
  }
}