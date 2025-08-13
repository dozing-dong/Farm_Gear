using System.ComponentModel.DataAnnotations;

namespace FarmGear_Application.Configuration;

/// <summary>
/// Alipay configuration options
/// </summary>
public class AlipayOptions
{
  [Required]
  public string Environment { get; set; } = "Sandbox"; // Sandbox | Production

  [Required(ErrorMessage = "Alipay AppId cannot be empty")]
  public string AppId { get; set; } = string.Empty;

  [Required(ErrorMessage = "Merchant private key cannot be empty")]
  public string MerchantPrivateKey { get; set; } = string.Empty;

  [Required(ErrorMessage = "Alipay public key cannot be empty")]
  public string AlipayPublicKey { get; set; } = string.Empty;

  [Required(ErrorMessage = "Callback URL cannot be empty")]
  [Url(ErrorMessage = "Callback URL format is incorrect")]
  public string NotifyUrl { get; set; } = string.Empty;

  [Url(ErrorMessage = "Gateway URL format is incorrect")]
  public string GatewayUrl { get; set; } = "https://openapi.alipaydev.com/gateway.do";

  [RegularExpression("^(utf-8|gbk|gb2312)$", ErrorMessage = "Charset can only be utf-8, gbk or gb2312")]
  public string Charset { get; set; } = "utf-8";

  [RegularExpression("^(RSA|RSA2)$", ErrorMessage = "Signature type can only be RSA or RSA2")]
  public string SignType { get; set; } = "RSA2";
}