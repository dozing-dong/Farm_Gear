using FluentValidation;
using FarmGear_Application.DTOs.Equipment;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Validators.Equipment;

/// <summary>
/// 更新设备状态请求验证器
/// </summary>
public class UpdateEquipmentStatusRequestValidator : AbstractValidator<UpdateEquipmentStatusRequest>
{
  public UpdateEquipmentStatusRequestValidator()
  {
    RuleFor(x => x.Status)
        .IsInEnum().WithMessage("Invalid equipment status")
        .NotEqual(EquipmentStatus.Rented).WithMessage("Equipment status cannot be manually set to 'Rented'");
  }
}