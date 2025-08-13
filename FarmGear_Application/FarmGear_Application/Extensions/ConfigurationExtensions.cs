using FarmGear_Application.Configuration;
using Microsoft.Extensions.Options;

namespace FarmGear_Application.Extensions;

/// <summary>
/// 配置扩展方法
/// </summary>
public static class ConfigurationExtensions
{
    /// <summary>
    /// 注册所有配置选项
    /// </summary>
    public static IServiceCollection AddApplicationConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        // 注册配置选项
        services.Configure<ApplicationSettings>(configuration.GetSection("ApplicationSettings"));
        services.Configure<RedisSettings>(configuration.GetSection("RedisSettings"));
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.Configure<AlipayOptions>(configuration.GetSection("Alipay"));
        services.Configure<HealthCheckSettings>(configuration.GetSection("HealthCheck"));
        services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));

        // 配置验证
        services.AddOptions<ApplicationSettings>()
            .Bind(configuration.GetSection("ApplicationSettings"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<RedisSettings>()
            .Bind(configuration.GetSection("RedisSettings"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<JwtSettings>()
            .Bind(configuration.GetSection("JwtSettings"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<AlipayOptions>()
            .Bind(configuration.GetSection("Alipay"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<EmailSettings>()
            .Bind(configuration.GetSection("EmailSettings"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<HealthCheckSettings>()
            .Bind(configuration.GetSection("HealthCheck"))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        return services;
    }
}