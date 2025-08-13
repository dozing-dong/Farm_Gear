using FluentValidation;
using FarmGear_Application.DTOs.Location;

namespace FarmGear_Application.Validators.Location;

/// <summary>
/// 更新位置请求验证器
/// </summary>
public class UpdateLocationRequestValidator : AbstractValidator<UpdateLocationRequest>
{
  public UpdateLocationRequestValidator()
  {
    RuleFor(x => x.Latitude)
        .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90");

    RuleFor(x => x.Longitude)
        .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180");
  }
}