using FarmGear_Application.Services.PaymentGateways;
using FarmGear_Application.Interfaces.PaymentGateways;

namespace FarmGear_Application.Tests.Mocks;

/// <summary>
/// AlipayService的Mock实现，用于测试
/// </summary>
public class MockAlipayService : IAlipayService
{
  /// <summary>
  /// 生成支付URL
  /// </summary>
  /// <param name="outTradeNo">商户订单号</param>
  /// <param name="amount">支付金额</param>
  /// <param name="subject">订单标题</param>
  /// <returns>支付URL</returns>
  public string GeneratePaymentUrl(string outTradeNo, decimal amount, string subject)
  {
    // 返回一个测试用的URL
    return $"https://test.alipay.com/gateway?out_trade_no={outTradeNo}&amount={amount}&subject={subject}";
  }

  /// <summary>
  /// 验证支付宝回调签名
  /// </summary>
  /// <param name="form">回调表单数据</param>
  /// <returns>验证结果</returns>
  public bool VerifySignature(Dictionary<string, string> form)
  {
    // 测试环境中总是返回true
    return true;
  }
}