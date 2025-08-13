using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Payment;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Interfaces.PaymentGateways;
using FarmGear_Application.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmGear_Application.Controllers;

/// <summary>
/// Payment controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
  private readonly IPaymentService _paymentService;
  private readonly IAlipayService _alipay;
  private readonly ILogger<PaymentController> _logger;

  public PaymentController(
      IPaymentService paymentService,
      IAlipayService alipay,
      ILogger<PaymentController> logger)
  {
    _paymentService = paymentService;
    _alipay = alipay;
    _logger = logger;
  }

  /// <summary>
  /// Create payment intent
  /// </summary>
  /// <param name="request">Create payment intent request</param>
  /// <returns>Payment status response</returns>
  /// <response code="200">Creation successful</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="401">Unauthorized</response>
  /// <response code="403">No permission</response>
  /// <response code="404">Order does not exist</response>
  /// <response code="409">Order already has payment record</response>
  /// <response code="500">Internal server error</response>
  [HttpPost("intent")]
  [ProducesResponseType(typeof(ApiResponse<PaymentStatusResponse>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _paymentService.CreatePaymentIntentAsync(request, userId);
      return result.Success switch
      {
        true => CreatedAtAction(nameof(GetPaymentRecordById), new { id = result.Data!.Id }, result),
        false => result.Message switch
        {
          "User does not exist" => NotFound(result),
          "Order does not exist" => NotFound(result),
          "No permission to pay for this order" => Forbid(),
          "Order is not in accepted status" => BadRequest(result),
          "Payment already exists for this order" => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while creating payment intent");
      return StatusCode(500, new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while creating payment intent"
      });
    }
  }

  /// <summary>
  /// 获取支付状态
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <returns>支付状态响应</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单或支付记录不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("status/{orderId}")]
  [ProducesResponseType(typeof(ApiResponse<PaymentStatusResponse>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetPaymentStatus(string orderId)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _paymentService.GetPaymentStatusAsync(orderId, userId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order does not exist" => NotFound(result),
          "No permission to view payment status for this order" => Forbid(),
          "No payment record found for this order" => NotFound(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving payment status: {OrderId}", orderId);
      return StatusCode(500, new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while retrieving payment status"
      });
    }
  }

  /// <summary>
  /// 获取支付记录列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>分页支付记录列表</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<PaymentStatusResponse>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetPaymentRecords([FromQuery] PaymentQueryParameters parameters)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaginatedList<PaymentStatusResponse>>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _paymentService.GetPaymentRecordsAsync(parameters, userId, isAdmin);
      return result.Success ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving payment records");
      return StatusCode(500, new ApiResponse<PaginatedList<PaymentStatusResponse>>
      {
        Success = false,
        Message = "An error occurred while retrieving payment records"
      });
    }
  }

  /// <summary>
  /// 获取支付记录详情
  /// </summary>
  /// <param name="id">支付记录ID</param>
  /// <returns>支付记录详情</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">支付记录不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("{id}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<PaymentStatusResponse>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetPaymentRecordById(string id)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _paymentService.GetPaymentRecordByIdAsync(id, userId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Payment record not found" => NotFound(result),
          "You are not authorized to view this payment record" => Forbid(),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving payment record details: {PaymentId}", id);
      return StatusCode(500, new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while retrieving payment record details"
      });
    }
  }

  /// <summary>
  /// 模拟支付完成（仅用于测试）
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <returns>支付状态响应</returns>
  /// <response code="200">支付成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单或支付记录不存在</response>
  /// <response code="409">支付状态不正确</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPost("complete/{orderId}")]
  [ProducesResponseType(typeof(ApiResponse<PaymentStatusResponse>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> CompletePayment(string orderId)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _paymentService.CompletePaymentAsync(orderId, userId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order does not exist" => NotFound(result),
          "No permission to complete payment for this order" => Forbid(),
          "No payment record found for this order" => NotFound(result),
          "Payment is not in pending status" => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while completing payment for order: {OrderId}", orderId);
      return StatusCode(500, new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while completing the payment"
      });
    }
  }

  /// <summary>
  /// 模拟支付 - 开发测试专用接口
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <returns>支付状态响应</returns>
  /// <response code="200">支付成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单不存在</response>
  /// <response code="409">订单状态不正确</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPost("mock-pay/{orderId}")]
  [ProducesResponseType(typeof(ApiResponse<PaymentStatusResponse>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> MockPayment(string orderId)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _paymentService.ProcessMockPaymentAsync(orderId, userId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order does not exist" => NotFound(result),
          "No permission to pay for this order" => Forbid(),
          "Order is not in accepted status" => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while processing mock payment for order: {OrderId}", orderId);
      return StatusCode(500, new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while processing the mock payment"
      });
    }
  }

  /// <summary>
  /// 取消支付
  /// </summary>
  /// <param name="orderId">订单ID</param>
  /// <returns>支付状态响应</returns>
  /// <response code="200">取消成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">订单或支付记录不存在</response>
  /// <response code="409">支付状态不允许取消</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("cancel/{orderId}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<PaymentStatusResponse>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> CancelPayment(string orderId)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<PaymentStatusResponse>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _paymentService.CancelPaymentAsync(orderId, userId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Order does not exist" => NotFound(result),
          "No permission to cancel payment for this order" => Forbid(),
          "No payment record found for this order" => NotFound(result),
          "Payment cannot be cancelled" => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while cancelling payment for order: {OrderId}", orderId);
      return StatusCode(500, new ApiResponse<PaymentStatusResponse>
      {
        Success = false,
        Message = "An error occurred while cancelling the payment"
      });
    }
  }

  /// <summary>
  /// 支付宝支付回调（外部回调接口）
  /// </summary>
  /// <returns>处理结果</returns>
  /// <remarks>
  /// 注意：这是外部回调接口，不遵循标准的API响应格式，返回文本内容以供第三方支付平台识别。
  /// - 返回 "success" 表示处理成功
  /// - 返回 "fail" 表示处理失败
  /// </remarks>
  /// <response code="200">处理成功</response>
  /// <response code="400">处理失败</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPost("callback")]
  [AllowAnonymous]
  [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(string), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> AlipayCallback()
  {
    try
    {
      var form = Request.Form.ToDictionary(x => x.Key, x => x.Value.ToString());

      // 验证签名
      if (!_alipay.VerifySignature(form))
      {
        _logger.LogWarning("Invalid Alipay callback signature");
        return Content("fail");
      }

      if (!form.TryGetValue("out_trade_no", out var paymentId) ||
          !form.TryGetValue("trade_status", out var tradeStatus) ||
          !form.TryGetValue("total_amount", out var totalAmount))
      {
        _logger.LogWarning("Missing required parameters in Alipay callback");
        return Content("fail");
      }

      if (tradeStatus != "TRADE_SUCCESS")
      {
        _logger.LogInformation("Payment not successful, trade status: {TradeStatus}", tradeStatus);
        return Content("success");
      }

      var result = await _paymentService.MarkPaymentAsSucceededAsync(paymentId);
      if (!result.Success)
      {
        _logger.LogError("Failed to mark payment as succeeded: {Message}", result.Message);
        return Content("fail");
      }

      return Content("success");
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error processing Alipay callback");
      return Content("fail");
    }
  }
}
