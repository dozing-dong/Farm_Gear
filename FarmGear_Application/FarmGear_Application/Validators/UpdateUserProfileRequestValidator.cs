using FarmGear_Application.DTOs;
using FluentValidation;

namespace FarmGear_Application.Validators;

/// <summary>
/// 更新用户信息请求验证器
/// </summary>
public class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
{
    public UpdateUserProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Full name is required")
            .Length(1, 100)
            .WithMessage("Full name must be between 1 and 100 characters")
            .Matches(@"^[\u4e00-\u9fa5a-zA-Z\s\-\.]+$")
            .WithMessage("Full name can only contain letters, spaces, hyphens, dots, and Chinese characters");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180")
            .When(x => x.Longitude.HasValue);

        // 如果提供了纬度，也必须提供经度
        RuleFor(x => x)
            .Must(x => (x.Latitude.HasValue && x.Longitude.HasValue) || (!x.Latitude.HasValue && !x.Longitude.HasValue))
            .WithMessage("Both latitude and longitude must be provided together")
            .When(x => x.Latitude.HasValue || x.Longitude.HasValue);
    }
}