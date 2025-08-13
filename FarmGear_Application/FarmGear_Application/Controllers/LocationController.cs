using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Location;
using FarmGear_Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Controllers;

/// <summary>
/// Location controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class LocationController : ControllerBase
{
  private readonly ILocationService _locationService;
  private readonly ILogger<LocationController> _logger;

  public LocationController(ILocationService locationService, ILogger<LocationController> logger)
  {
    _locationService = locationService;
    _logger = logger;
  }

  /// <summary>
  /// Get nearby equipment
  /// </summary>
  /// <param name="parameters">Query parameters</param>
  /// <returns>Paginated list of equipment location information</returns>
  /// <response code="200">Successfully retrieved</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="500">Internal server error</response>
  [HttpGet("nearby-equipment")]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<EquipmentLocationDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetNearbyEquipment([FromQuery] LocationQueryParameters parameters)
  {
    try
    {
      var result = await _locationService.GetNearbyEquipmentAsync(parameters);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Invalid coordinates" => BadRequest(result),
          "Invalid radius" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving nearby equipment");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<PaginatedList<EquipmentLocationDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving nearby equipment"
      });
    }
  }

  /// <summary>
  /// 获取设备分布热力图数据
  /// </summary>
  /// <param name="southWestLat">西南角纬度</param>
  /// <param name="southWestLng">西南角经度</param>
  /// <param name="northEastLat">东北角纬度</param>
  /// <param name="northEastLng">东北角经度</param>
  /// <param name="status">设备状态（可选）</param>
  /// <param name="equipmentType">设备类型（可选）</param>
  /// <returns>热力图点数据列表</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("equipment-heatmap")]
  [ProducesResponseType(typeof(ApiResponse<List<HeatmapPoint>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetEquipmentHeatmap(
      [FromQuery] double southWestLat,
      [FromQuery] double southWestLng,
      [FromQuery] double northEastLat,
      [FromQuery] double northEastLng,
      [FromQuery] EquipmentStatus? status = null,
      [FromQuery] string? equipmentType = null)
  {
    try
    {
      var result = await _locationService.GetEquipmentHeatmapAsync(
          southWestLat,
          southWestLng,
          northEastLat,
          northEastLng,
          status,
          equipmentType);

      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Invalid map bounds" => BadRequest(result),
          "Invalid coordinates" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving equipment heatmap");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<List<HeatmapPoint>>
      {
        Success = false,
        Message = "An error occurred while retrieving equipment heatmap"
      });
    }
  }

  /// <summary>
  /// 获取供应商分布
  /// </summary>
  /// <param name="southWestLat">西南角纬度</param>
  /// <param name="southWestLng">西南角经度</param>
  /// <param name="northEastLat">东北角纬度</param>
  /// <param name="northEastLng">东北角经度</param>
  /// <param name="minEquipmentCount">最少设备数量（可选）</param>
  /// <returns>供应商位置信息列表</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("provider-distribution")]
  [ProducesResponseType(typeof(ApiResponse<List<ProviderLocationDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetProviderDistribution(
      [FromQuery] double southWestLat,
      [FromQuery] double southWestLng,
      [FromQuery] double northEastLat,
      [FromQuery] double northEastLng,
      [FromQuery] int? minEquipmentCount = null)
  {
    try
    {
      var result = await _locationService.GetProviderDistributionAsync(
          southWestLat,
          southWestLng,
          northEastLat,
          northEastLng,
          minEquipmentCount);

      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Invalid map bounds" => BadRequest(result),
          "Invalid coordinates" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving provider distribution");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<List<ProviderLocationDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving provider distribution"
      });
    }
  }

  /// <summary>
  /// 更新用户位置
  /// </summary>
  /// <param name="request">位置信息</param>
  /// <returns>更新结果</returns>
  /// <response code="200">更新成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="404">用户不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("my-location")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<LocationViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UpdateMyLocation([FromBody] UpdateLocationRequest request)
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<LocationViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _locationService.UpdateUserLocationAsync(userId, request);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "User does not exist" => NotFound(result),
          "Invalid coordinates" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while updating user location");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<LocationViewDto>
      {
        Success = false,
        Message = "An error occurred while updating user location"
      });
    }
  }

  /// <summary>
  /// 获取当前用户位置
  /// </summary>
  /// <returns>用户位置信息</returns>
  /// <response code="200">获取成功</response>
  /// <response code="401">未授权</response>
  /// <response code="404">用户不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpGet("my-location")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<LocationViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetMyLocation()
  {
    try
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return BadRequest(new ApiResponse<LocationViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _locationService.GetUserLocationAsync(userId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "User does not exist" => NotFound(result),
          "User location not set" => NotFound(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving user location");
      return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<LocationViewDto>
      {
        Success = false,
        Message = "An error occurred while retrieving user location"
      });
    }
  }
}