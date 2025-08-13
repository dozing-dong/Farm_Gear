using FluentValidation;
using FarmGear_Application.DTOs.Location;

namespace FarmGear_Application.Validators.Location;

/// <summary>
/// 位置查询参数验证器
/// </summary>
public class LocationQueryParametersValidator : AbstractValidator<LocationQueryParameters>
{
  public LocationQueryParametersValidator()
  {
    RuleFor(x => x.Latitude)
        .InclusiveBetween(-90, 90).WithMessage("Latitude must be between -90 and 90");

    RuleFor(x => x.Longitude)
        .InclusiveBetween(-180, 180).WithMessage("Longitude must be between -180 and 180");

    RuleFor(x => x.Radius)
        .GreaterThan(0).WithMessage("Radius must be greater than 0")
        .LessThanOrEqualTo(100000).WithMessage("Radius cannot exceed 100000 meters");

    RuleFor(x => x.PageNumber)
        .GreaterThan(0).WithMessage("Page number must be greater than 0");

    RuleFor(x => x.PageSize)
        .GreaterThan(0).WithMessage("Page size must be greater than 0")
        .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

    RuleFor(x => x.MinPrice)
        .GreaterThanOrEqualTo(0).WithMessage("Minimum price cannot be negative")
        .When(x => x.MinPrice.HasValue);

    RuleFor(x => x.MaxPrice)
        .GreaterThan(0).WithMessage("Maximum price must be greater than 0")
        .GreaterThanOrEqualTo(x => x.MinPrice).WithMessage("Maximum price must be greater than or equal to minimum price")
        .When(x => x.MaxPrice.HasValue);
  }
}