namespace FarmGear_Application.Constants;

/// <summary>
/// User role constants
/// </summary>
public static class UserRoles
{
  /// <summary>
  /// Farmer
  /// </summary>
  public const string Farmer = "Farmer";

  /// <summary>
  /// Equipment provider
  /// </summary>
  public const string Provider = "Provider";

  /// <summary>
  /// Official personnel
  /// </summary>
  public const string Official = "Official";

  /// <summary>
  /// Administrator
  /// </summary>
  public const string Admin = "Admin";

  /// <summary>
  /// All roles
  /// </summary>
  public static readonly string[] AllRoles = { Farmer, Provider, Official, Admin };
}