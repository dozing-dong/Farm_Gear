using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Equipment;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FarmGear_Application.Controllers;

/// <summary>
/// Equipment controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
  private readonly IEquipmentService _equipmentService;
  private readonly ILogger<EquipmentController> _logger;

  public EquipmentController(
      IEquipmentService equipmentService,
      ILogger<EquipmentController> logger)
  {
    _equipmentService = equipmentService;
    _logger = logger;
  }

  /// <summary>
  /// Create equipment
  /// </summary>
  /// <param name="request">Create equipment request</param>
  /// <returns>Equipment view</returns>
  /// <response code="201">Creation successful</response>
  /// <response code="400">Request parameter error</response>
  /// <response code="401">Unauthorized</response>
  /// <response code="403">No permission</response>
  [HttpPost]
  [Authorize(Roles = $"{UserRoles.Provider},{UserRoles.Official}")]
  [ProducesResponseType(typeof(ApiResponse<EquipmentViewDto>), StatusCodes.Status201Created)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  public async Task<IActionResult> CreateEquipment([FromForm] CreateEquipmentRequest request)
  {
    try
    {
      var ownerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(ownerId))
      {
        return BadRequest(new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _equipmentService.CreateEquipmentAsync(request, ownerId);
      return result.Success switch
      {
        true => result.Data == null
          ? StatusCode(500, new ApiResponse<EquipmentViewDto> { Success = false, Message = "Created equipment data is null" })
          : CreatedAtAction(nameof(GetEquipmentById), new { id = result.Data.Id }, result),
        false => result.Message switch
        {
          "Owner does not exist" => NotFound(result),
          "Category is required" => BadRequest(result),
          "Location is required for Farmer role" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while creating equipment");
      return StatusCode(500, new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while creating equipment"
      });
    }
  }

  /// <summary>
  /// 获取设备列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>分页设备列表</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  [HttpGet]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<EquipmentViewDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> GetEquipmentList([FromQuery] EquipmentQueryParameters parameters)
  {
    try
    {
      var result = await _equipmentService.GetEquipmentListAsync(parameters);
      return result.Success ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving equipment list");
      return StatusCode(500, new ApiResponse<PaginatedList<EquipmentViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving equipment list"
      });
    }
  }

  /// <summary>
  /// 获取设备详情
  /// </summary>
  /// <param name="id">设备ID</param>
  /// <returns>设备视图</returns>
  /// <response code="200">获取成功</response>
  /// <response code="404">设备不存在</response>
  [HttpGet("{id}")]
  [ProducesResponseType(typeof(ApiResponse<EquipmentViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  public async Task<IActionResult> GetEquipmentById(string id)
  {
    try
    {
      var result = await _equipmentService.GetEquipmentByIdAsync(id);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Equipment does not exist" => NotFound(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving equipment details: {EquipmentId}", id);
      return StatusCode(500, new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while retrieving equipment details"
      });
    }
  }

  /// <summary>
  /// 获取我的设备列表
  /// </summary>
  /// <param name="parameters">查询参数</param>
  /// <returns>分页设备列表</returns>
  /// <response code="200">获取成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  [HttpGet("my-equipment")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<PaginatedList<EquipmentViewDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  public async Task<IActionResult> GetMyEquipmentList([FromQuery] EquipmentQueryParameters parameters)
  {
    try
    {
      var ownerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(ownerId))
      {
        return BadRequest(new ApiResponse<PaginatedList<EquipmentViewDto>>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _equipmentService.GetUserEquipmentListAsync(ownerId, parameters);
      return result.Success ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while retrieving user equipment list");
      return StatusCode(500, new ApiResponse<PaginatedList<EquipmentViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving user equipment list"
      });
    }
  }

  /// <summary>
  /// 更新设备信息
  /// </summary>
  /// <param name="id">设备ID</param>
  /// <param name="request">更新设备请求</param>
  /// <returns>更新后的设备信息</returns>
  /// <response code="200">更新成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">设备不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("{id}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<EquipmentViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UpdateEquipment(string id, [FromForm] UpdateEquipmentRequest request)
  {
    try
    {
      var ownerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(ownerId))
      {
        return BadRequest(new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _equipmentService.UpdateEquipmentAsync(id, request, ownerId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Equipment does not exist" => NotFound(result),
          "No permission to modify this equipment" => Forbid(),
          "Equipment status can only be set to 'Rented' through the order system" => BadRequest(result),
          "Cannot modify equipment while it is rented" => BadRequest(result),
          var msg when msg.StartsWith("Invalid status transition") => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while updating equipment: {EquipmentId}", id);
      return StatusCode(500, new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while updating equipment"
      });
    }
  }

  /// <summary>
  /// 删除设备
  /// </summary>
  /// <param name="id">设备ID</param>
  /// <returns>操作结果</returns>
  /// <response code="200">删除成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">设备不存在</response>
  /// <response code="409">设备有活跃订单</response>
  [HttpDelete("{id}")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
  public async Task<IActionResult> DeleteEquipment(string id)
  {
    try
    {
      var ownerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(ownerId))
      {
        return BadRequest(new ApiResponse
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var isAdmin = User.IsInRole("Admin");
      var result = await _equipmentService.DeleteEquipmentAsync(id, ownerId, isAdmin);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Equipment does not exist" => NotFound(result),
          "No permission to delete this equipment" => Forbid(),
          "Equipment has active orders and cannot be deleted" => Conflict(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while deleting equipment: {EquipmentId}", id);
      return StatusCode(500, new ApiResponse
      {
        Success = false,
        Message = "An error occurred while deleting equipment"
      });
    }
  }

  /// <summary>
  /// 更新设备状态
  /// </summary>
  /// <param name="id">设备ID</param>
  /// <param name="request">状态更新请求</param>
  /// <returns>更新后的设备信息</returns>
  /// <response code="200">更新成功</response>
  /// <response code="400">请求参数错误</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">设备不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPatch("{id}/status")]
  [Authorize]
  [ProducesResponseType(typeof(ApiResponse<EquipmentViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> UpdateEquipmentStatus(string id, [FromBody] UpdateEquipmentStatusRequest request)
  {
    try
    {
      var ownerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(ownerId))
      {
        return BadRequest(new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _equipmentService.UpdateEquipmentStatusAsync(id, request, ownerId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Equipment does not exist" => NotFound(result),
          "No permission to modify this equipment" => Forbid(),
          "Equipment status can only be set to 'Rented' through the order system" => BadRequest(result),
          "Cannot modify equipment while it is rented" => BadRequest(result),
          var msg when msg.StartsWith("Invalid status transition") => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while updating equipment status: {EquipmentId}", id);
      return StatusCode(500, new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while updating equipment status"
      });
    }
  }

  /// <summary>
  /// 确认设备归还 - 新增功能
  /// </summary>
  /// <param name="id">设备ID</param>
  /// <returns>设备视图</returns>
  /// <remarks>
  /// 用于Provider确认从PendingReturn状态的设备已经收回，
  /// 将设备状态设置为Available，允许重新租用。
  /// 
  /// 使用场景：
  /// 1. 租期结束后，系统自动将设备标记为PendingReturn
  /// 2. Provider检查设备已经归还
  /// 3. Provider调用此接口确认归还
  /// 4. 设备状态变为Available，可以重新租用
  /// </remarks>
  /// <response code="200">确认成功</response>
  /// <response code="400">请求参数错误或设备状态不正确</response>
  /// <response code="401">未授权</response>
  /// <response code="403">无权限</response>
  /// <response code="404">设备不存在</response>
  /// <response code="500">服务器内部错误</response>
  [HttpPut("{id}/confirm-return")]
  [Authorize(Roles = $"{UserRoles.Provider},{UserRoles.Official}")]
  [ProducesResponseType(typeof(ApiResponse<EquipmentViewDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> ConfirmEquipmentReturn(string id)
  {
    try
    {
      var ownerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(ownerId))
      {
        return BadRequest(new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Failed to get user information"
        });
      }

      var result = await _equipmentService.ConfirmEquipmentReturnAsync(id, ownerId);
      return result.Success switch
      {
        true => Ok(result),
        false => result.Message switch
        {
          "Equipment not found" => NotFound(result),
          "No permission to confirm return for this equipment" => Forbid(),
          "Equipment is not pending return" => BadRequest(result),
          _ => BadRequest(result)
        }
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error occurred while confirming equipment return: {EquipmentId}", id);
      return StatusCode(500, new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while confirming equipment return"
      });
    }
  }
}