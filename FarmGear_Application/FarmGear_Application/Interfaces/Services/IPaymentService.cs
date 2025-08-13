using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Payment;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Interfaces.Services;

/// <summary>
/// 支付服务接口
/// </summary>
public interface IPaymentService
{
  /// <summary>
  /// 创建支付意图
  /// </summary>
  /// <param name="request">创建支付意图请求</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  Task<ApiResponse<PaymentStatusResponse>> CreatePaymentIntentAsync(CreatePaymentIntentRequest request, string userId);

  /// <summary>
  /// 获取支付状态
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <param name="isAdmin">是否为管理员</param>
  /// <returns>支付状态响应</returns>
  Task<ApiResponse<PaymentStatusResponse>> GetPaymentStatusAsync(string orderId, string userId, bool isAdmin);

  /// <summary>
  /// 获取支付记录列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <param name="userId">用户ID</param>
  /// <param name="isAdmin">是否为管理员</param>
  /// <returns>分页支付记录列表</returns>
  Task<ApiResponse<PaginatedList<PaymentStatusResponse>>> GetPaymentRecordsAsync(PaymentQueryParameters parameters, string userId, bool isAdmin);

  /// <summary>
  /// 根据ID获取支付记录详情
  /// </summary>
  /// <param name="id">支付记录ID</param>
  /// <param name="userId">用户ID</param>
  /// <param name="isAdmin">是否为管理员</param>
  /// <returns>支付记录详情</returns>
  Task<ApiResponse<PaymentStatusResponse>> GetPaymentRecordByIdAsync(string id, string userId, bool isAdmin);

  /// <summary>
  /// 模拟支付完成
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  Task<ApiResponse<PaymentStatusResponse>> CompletePaymentAsync(string orderId, string userId);

  /// <summary>
  /// 取消支付
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  Task<ApiResponse<PaymentStatusResponse>> CancelPaymentAsync(string orderId, string userId);

  /// <summary>
  /// 标记支付为成功
  /// </summary>
  /// <param name="paymentId">支付记录ID</param>
  /// <returns>支付状态响应</returns>
  Task<ApiResponse<PaymentStatusResponse>> MarkPaymentAsSucceededAsync(string paymentId);

  /// <summary>
  /// 处理模拟支付 - 开发测试专用
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <param name="userId">用户ID</param>
  /// <returns>支付状态响应</returns>
  Task<ApiResponse<PaymentStatusResponse>> ProcessMockPaymentAsync(string orderId, string userId);
}