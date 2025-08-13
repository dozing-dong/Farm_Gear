using FluentValidation;
using FarmGear_Application.DTOs;
using FarmGear_Application.Services;
using FarmGear_Application.Constants;

using FarmGear_Application.Interfaces.Services;

/// <summary>
/// Registration request validator
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
  private readonly IAuthService _authService;

  public RegisterRequestValidator(IAuthService authService)
  {
    _authService = authService ?? throw new ArgumentNullException(nameof(authService));

    // Username validation rules
    RuleFor(x => x.Username)
        .NotEmpty().WithMessage("Username is required")
        .Length(3, 50).WithMessage("Username must be between 3 and 50 characters")
        .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Username can only contain letters, numbers, underscores and hyphens")
        .MustAsync(async (username, cancellation) =>
        {
          return !await _authService.IsUsernameTakenAsync(username);
        }).WithMessage("Username is already taken");

    // Email validation rules
    RuleFor(x => x.Email)
        .NotEmpty().WithMessage("Email is required")
        .EmailAddress().WithMessage("Invalid email format")
        .MustAsync(async (email, cancellation) =>
        {
          return !await _authService.IsEmailTakenAsync(email);
        }).WithMessage("Email is already registered")
        .MaximumLength(100).WithMessage("Email cannot exceed 100 characters");

    // Password validation rules
    RuleFor(x => x.Password)
        .NotEmpty().WithMessage("Password is required")
        .MinimumLength(8).WithMessage("Password must be at least 8 characters")
        .MaximumLength(100).WithMessage("Password cannot exceed 100 characters")
        .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
        .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
        .Matches("[0-9]").WithMessage("Password must contain at least one number")
        .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character")
        .NotEqual(x => x.Username).WithMessage("Password cannot be the same as username")
        .NotEqual(x => x.Email).WithMessage("Password cannot be the same as email");

    // Confirm password validation rules
    RuleFor(x => x.ConfirmPassword)
        .NotEmpty().WithMessage("Confirm password is required")
        .Equal(x => x.Password).WithMessage("Passwords do not match");

    // Full name validation rules
    RuleFor(x => x.FullName)
        .MaximumLength(100).WithMessage("Full name cannot exceed 100 characters")
        .Matches("^[\u4e00-\u9fa5a-zA-Z\\s]+$").WithMessage("Full name can only contain Chinese characters, English letters and spaces");

    // Role validation rules
    RuleFor(x => x.Role)
        .NotEmpty().WithMessage("Role is required")
        .Must(role => UserRoles.AllRoles.Contains(role))
        .WithMessage("Invalid role type");
  }
}