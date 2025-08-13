using FarmGear_Application.Data;
using FarmGear_Application.DTOs;
using FarmGear_Application.Enums;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmGear_Application.Services;

/// <summary>
/// Order expiration background service
/// </summary>
public class OrderExpirationService : BackgroundService, IOrderExpirationService
{
  private readonly IServiceProvider _serviceProvider;
  private readonly ILogger<OrderExpirationService> _logger;
  private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30); // Fixed 30 minutes

  public OrderExpirationService(
      IServiceProvider serviceProvider,
      ILogger<OrderExpirationService> logger)
  {
    _serviceProvider = serviceProvider;
    _logger = logger;
  }

  /// <summary>
  /// Background service main loop
  /// </summary>
  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    _logger.LogInformation("Order expiration service started, check interval: 30 minutes");

    while (!stoppingToken.IsCancellationRequested)
    {
      try
      {
        await CheckAndCompleteExpiredOrdersAsync();
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error occurred during order expiration check");
      }

      try
      {
        await Task.Delay(_checkInterval, stoppingToken);
      }
      catch (TaskCanceledException)
      {
        break;
      }
    }

    _logger.LogInformation("Order expiration service stopped");
  }

  /// <inheritdoc/>
  public async Task<ApiResponse<OrderExpirationResult>> CheckAndCompleteExpiredOrdersAsync()
  {
    using var scope = _serviceProvider.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    var result = new OrderExpirationResult();

    try
    {
      var currentTime = DateTime.UtcNow;

      // 1. 查找应该开始的订单（已接受且到达开始时间）
      var ordersToStart = await context.Orders
          .Include(o => o.Equipment)
          .Where(o => o.Status == OrderStatus.Accepted && o.StartDate <= currentTime)
          .ToListAsync();

      foreach (var order in ordersToStart)
      {
        try
        {
          order.Status = OrderStatus.InProgress;
          order.UpdatedAt = currentTime;

          if (order.Equipment != null)
          {
            order.Equipment.Status = EquipmentStatus.Rented;
            _logger.LogInformation("Order {OrderId} started, equipment {EquipmentId} is now rented",
                order.Id, order.EquipmentId);
          }

          result.ProcessedOrderCount++;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Error starting order {OrderId}", order.Id);
        }
      }

      // 2. 查找应该完成的订单（进行中且超过结束时间）
      var ordersToComplete = await context.Orders
          .Include(o => o.Equipment)
          .Where(o => o.Status == OrderStatus.InProgress && o.EndDate < currentTime)
          .ToListAsync();

      foreach (var order in ordersToComplete)
      {
        try
        {
          // 订单状态变为完成（用于评论权限，永不改变）
          order.Status = OrderStatus.Completed;
          order.UpdatedAt = currentTime;

          // 设备状态变为待归还（等待Provider确认收回）
          if (order.Equipment != null)
          {
            order.Equipment.Status = EquipmentStatus.PendingReturn;
            _logger.LogInformation("Order {OrderId} completed, equipment {EquipmentId} is pending return",
                order.Id, order.EquipmentId);
          }

          result.ProcessedOrderCount++;
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Error completing order {OrderId}", order.Id);
        }
      }

      var totalProcessed = ordersToStart.Count + ordersToComplete.Count;
      if (totalProcessed == 0)
      {
        _logger.LogDebug("No orders requiring status update found");
        return new ApiResponse<OrderExpirationResult>
        {
          Success = true,
          Message = "No orders to process",
          Data = result
        };
      }

      _logger.LogInformation("Processed {StartedCount} order starts and {CompletedCount} order completions",
          ordersToStart.Count, ordersToComplete.Count);

      await context.SaveChangesAsync();

      var message = $"Processed {result.ProcessedOrderCount} expired orders";
      _logger.LogInformation(message);

      return new ApiResponse<OrderExpirationResult>
      {
        Success = true,
        Message = message,
        Data = result
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred during batch processing of expired orders");
      return new ApiResponse<OrderExpirationResult>
      {
        Success = false,
        Message = "Error processing expired orders",
        Data = result
      };
    }
  }
}