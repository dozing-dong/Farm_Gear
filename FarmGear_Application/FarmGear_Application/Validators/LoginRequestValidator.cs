using FluentValidation;
using FarmGear_Application.DTOs;

namespace FarmGear_Application.Validators;

/// <summary>
/// Login request validator
/// </summary>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
  public LoginRequestValidator()
  {
    // Username or email validation rules
    RuleFor(x => x.UsernameOrEmail)
        .NotEmpty().WithMessage("Username or email is required")
        .MaximumLength(100).WithMessage("Username or email cannot exceed 100 characters");

    // Password validation rules
    RuleFor(x => x.Password)
        .NotEmpty().WithMessage("Password is required")
        .MaximumLength(100).WithMessage("Password cannot exceed 100 characters");

    // Can add validation for login attempt limit
    // This requires implementing specific logic in AuthService
  }
}