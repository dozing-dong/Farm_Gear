namespace FarmGear_Application.Interfaces.PaymentGateways;

/// <summary>
/// 支付宝支付服务接口
/// </summary>
public interface IAlipayService
{
  /// <summary>
  /// 生成支付URL
  /// </summary>
  /// <param name="outTradeNo">商户订单号</param>
  /// <param name="amount">支付金额</param>
  /// <param name="subject">订单标题</param>
  /// <returns>支付URL</returns>
  string GeneratePaymentUrl(string outTradeNo, decimal amount, string subject);

  /// <summary>
  /// 验证支付宝回调签名
  /// </summary>
  /// <param name="form">回调表单数据</param>
  /// <returns>验证结果</returns>
  bool VerifySignature(Dictionary<string, string> form);
}