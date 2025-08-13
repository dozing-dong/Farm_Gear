using FarmGear_Application.Data;
using FarmGear_Application.DTOs;
using FarmGear_Application.DTOs.Equipment;
using FarmGear_Application.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FarmGear_Application.Interfaces.Services;
using FarmGear_Application.Enums;

namespace FarmGear_Application.Services;

/// <summary>
/// Equipment service implementation
/// </summary>
public class EquipmentService : IEquipmentService
{
  private readonly ApplicationDbContext _context;
  private readonly UserManager<AppUser> _userManager;
  private readonly ILogger<EquipmentService> _logger;
  private readonly IFileService _fileService;

  public EquipmentService(
      // This is ApplicationDbContext, which represents: application context, used for managing database connections and operations
      ApplicationDbContext context,
      // This is UserManager<AppUser>, which represents: user manager, used for managing user information
      UserManager<AppUser> userManager,
      // This is ILogger<EquipmentService>, which represents: logger, used for recording log information
      ILogger<EquipmentService> logger,
      // This is IFileService, which represents: file service, used for handling file uploads
      IFileService fileService)
  {
    _context = context;
    _userManager = userManager;
    _logger = logger;
    _fileService = fileService;
  }

  public async Task<ApiResponse<EquipmentViewDto>> CreateEquipmentAsync(CreateEquipmentRequest request, string ownerId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Check if user exists and assign the queried user data to the owner variable
      var owner = await _userManager.FindByIdAsync(ownerId);
      if (owner == null)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "User does not exist"
        };
      }

      // Check user role, this owner is user data queried from User table based on ownerId
      var roles = await _userManager.GetRolesAsync(owner);
      if (!roles.Contains("Provider") && !roles.Contains("Official"))
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Only providers and officials can create equipment"
        };
      }

      // Create equipment
      var equipment = new Equipment
      {
        Name = request.Name,
        Description = request.Description,
        DailyPrice = request.DailyPrice,
        Latitude = (decimal)request.Latitude,
        Longitude = (decimal)request.Longitude,
        OwnerId = ownerId,
        Status = EquipmentStatus.Available,
        Type = request.Type // Add equipment type
      };

      _context.Equipment.Add(equipment);
      await _context.SaveChangesAsync();

      // Handle image upload (if any)
      if (request.Image != null)
      {
        var uploadResult = await _fileService.UploadEquipmentImageAsync(request.Image, equipment.Id);
        if (uploadResult.Success && uploadResult.Data != null)
        {
          equipment.ImageUrl = uploadResult.Data.FileUrl;
          await _context.SaveChangesAsync();
        }
        else
        {
          // If image upload fails, log warning but don't rollback equipment creation
          _logger.LogWarning("Failed to upload equipment image for equipment {EquipmentId}: {Message}",
              equipment.Id, uploadResult.Message);
        }
      }

      await transaction.CommitAsync();

      // Return equipment view, MapToViewDtoAsync returns a simplified or refactored data structure,
      // It only contains some necessary information of the equipment, not all information
      return new ApiResponse<EquipmentViewDto>
      {
        Success = true,
        Message = "Equipment created successfully",
        Data = await MapToViewDtoAsync(equipment)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "An error occurred while creating equipment");
      return new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while creating equipment"
      };
    }
  }

  public async Task<ApiResponse<PaginatedList<EquipmentViewDto>>> GetEquipmentListAsync(EquipmentQueryParameters parameters)
  {
    try
    {
      var query = _context.Equipment
          // This is for optimizing query performance, because each query needs to query the Owner table, so query it in advance here to avoid multiple queries
          .Include(e => e.Owner)
          // A dbset implements both IEnumerable<T> and IQueryable<T>
          // .AsQueryable() is to make a collection execute delayed
          //👉 Don't execute the query immediately,
          //👉 but build an expression tree that can continue to append operations, and execute them all at the end.
          // If this is not added, the context may be implicitly converted to IEnumerable<Equipment>, which is an immediate query execution, so you cannot use query.Where() in the following if conditions
          // Because IEnumerable<Equipment> has no Where method, and your query chain is broken
          // Here we ensure that query is an IQueryable<Equipment> class
          .AsQueryable();

      // Apply filter conditions, if search condition is not empty, apply the search condition to the query
      // Search condition is SearchTerm, it is a string representing the search keyword
      // The search keyword can be equipment name or description

      // The first if condition is search condition is not empty, apply the search condition to the query, convert the search condition to lowercase, and put it into the expression tree, waiting for execution
      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower();
        query = query.Where(e =>
            e.Name.ToLower().Contains(searchTerm) ||
            e.Description.ToLower().Contains(searchTerm));
      }

      // The second if condition is if minimum price is not empty, apply the minimum price to the query
      if (parameters.MinDailyPrice.HasValue)
      {
        query = query.Where(e => e.DailyPrice >= parameters.MinDailyPrice.Value);
      }

      // The third if condition is if maximum price is not empty, apply the maximum price to the query
      if (parameters.MaxDailyPrice.HasValue)
      {
        query = query.Where(e => e.DailyPrice <= parameters.MaxDailyPrice.Value);
      }

      // The fourth if condition is if status is not empty, apply the status to the query, this so-called status is Available in the EquipmentStatus enumeration,
      // Available in the EquipmentStatus enumeration means the equipment is available, other statuses mean the equipment is unavailable
      if (parameters.Status.HasValue)
      {
        query = query.Where(e => e.Status == parameters.Status.Value);
      }

      // The fifth if condition is if equipment type is not empty, apply the equipment type to the query
      if (!string.IsNullOrWhiteSpace(parameters.Type))
      {
        query = query.Where(e => e.Type.ToLower() == parameters.Type.ToLower());
      }

      // Apply sorting, sort the query, the basis of sorting is SortBy, which is a string representing the basis of sorting
      // The basis of sorting can be equipment name, equipment price, equipment creation time
      // The order of sorting can be ascending or descending
      // The order of sorting is determined by IsAscending, if IsAscending is true, it means ascending, otherwise it means descending
      // The basis of sorting is determined by the SortBy variable, if SortBy is "name", it means sorting by equipment name, if SortBy is "dailyprice", it means sorting by equipment price, if SortBy is "createdat", it means sorting by equipment creation time
      // If SortBy is other values, it means sorting by equipment creation time
      // Use switch statement to decide the basis of sorting based on the value of SortBy
      //👉 If SortBy is "name", it means sorting by equipment name, if SortBy is "dailyprice", it means sorting by equipment price, if SortBy is "createdat", it means sorting by equipment creation time
      //👉 If SortBy is other values, it means sorting by equipment creation time
      //👉 If IsAscending is true, it means ascending, otherwise it means descending
      //👉 If SortBy is null, it means sorting by equipment creation time
      //👉 If SortBy is empty, it means sorting by equipment creation time
      //👉 If SortBy is empty, it means sorting by equipment creation time
      query = parameters.SortBy?.ToLower() switch
      {
        "name" => parameters.IsAscending
            ? query.OrderBy(e => e.Name)
            : query.OrderByDescending(e => e.Name),
        "dailyprice" => parameters.IsAscending
            ? query.OrderBy(e => e.DailyPrice)
            : query.OrderByDescending(e => e.DailyPrice),
        "createdat" => parameters.IsAscending
            ? query.OrderBy(e => e.CreatedAt)
            : query.OrderByDescending(e => e.CreatedAt),
        _ => query.OrderByDescending(e => e.CreatedAt)
      };

      // Get paginated data
      //👉 Get paginated data, PaginatedList<Equipment> is a paginated data wrapper class, CreateAsync is a static method for creating a paginated list
      //👉 Parameters: query is the query, parameters.PageNumber is the page number, parameters.PageSize is the page size
      //👉 Return: paginated data, PaginatedList<Equipment> is a paginated data wrapper class, this method execution equals returning the data of a specific page you want
      // Simply put, it returns a custom list that contains the data of a single page as well as total record count, total pages, current page number, page size
      var paginatedList = await PaginatedList<Equipment>.CreateAsync(
          query,
          parameters.PageNumber,
          parameters.PageSize);

      // Convert to view DTO

      var items = await Task.WhenAll(
          // .Select(...) is a LINQ extension method
          //👉 It is used to execute a function on each element in the collection and return a new collection containing the results
          // MapToViewDtoAsync is a custom method you defined, used to convert data from Equipment table to EquipmentViewDto table
          // For each element in the collection, the MapToViewDtoAsync method is executed asynchronously repeatedly until all elements in the collection are completed
          //👉 Finally convert the result to an array, each element in the array is data of EquipmentViewDto type
          //EquipmentViewDto[] items = [Dto1, Dto2, Dto3]
          paginatedList.Items.Select(MapToViewDtoAsync));

      return new ApiResponse<PaginatedList<EquipmentViewDto>>
      {
        Success = true,
        Data = new PaginatedList<EquipmentViewDto>(
              //👉 Convert the items array to a list and store it in the Items property of PaginatedList<EquipmentViewDto> through this constructor
              items.ToList(),
              paginatedList.TotalCount,
              paginatedList.PageNumber,
              paginatedList.PageSize)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving equipment list");
      return new ApiResponse<PaginatedList<EquipmentViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving equipment list"
      };
    }
  }
  // Get equipment details by equipment id
  public async Task<ApiResponse<EquipmentViewDto>> GetEquipmentByIdAsync(string id)
  {
    try
    {
      // You have noticed that every method will var a _context.Equipments
      // This is a **"query gateway", each access is equivalent to starting a new database query chain**
      // In other words:
      //👉 Each access is equivalent to starting a new database query chain

      var equipment = await _context.Equipment
          .Include(e => e.Owner)
          .FirstOrDefaultAsync(e => e.Id == id);

      if (equipment == null)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment does not exist"
        };
      }

      return new ApiResponse<EquipmentViewDto>
      {
        Success = true,
        Data = await MapToViewDtoAsync(equipment)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving equipment details");
      return new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while retrieving equipment details"
      };
    }
  }
  // Get all equipment of a user by user id, and can filter equipment, the first parameter is user id, the second is query parameters
  public async Task<ApiResponse<PaginatedList<EquipmentViewDto>>> GetUserEquipmentListAsync(
      string ownerId,
      EquipmentQueryParameters parameters)
  {
    try
    {
      var query = _context.Equipment
          .Include(e => e.Owner)
          .Where(e => e.OwnerId == ownerId)
          .AsQueryable();

      // Apply filter conditions, if search condition is not empty, apply the search condition to the query
      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
      {
        var searchTerm = parameters.SearchTerm.ToLower();
        query = query.Where(e =>
            e.Name.ToLower().Contains(searchTerm) ||
            e.Description.ToLower().Contains(searchTerm));
      }

      if (parameters.MinDailyPrice.HasValue)
      {
        query = query.Where(e => e.DailyPrice >= parameters.MinDailyPrice.Value);
      }

      if (parameters.MaxDailyPrice.HasValue)
      {
        query = query.Where(e => e.DailyPrice <= parameters.MaxDailyPrice.Value);
      }

      if (parameters.Status.HasValue)
      {
        query = query.Where(e => e.Status == parameters.Status.Value);
      }

      // Apply equipment type filtering
      if (!string.IsNullOrWhiteSpace(parameters.Type))
      {
        query = query.Where(e => e.Type.ToLower() == parameters.Type.ToLower());
      }

      // Apply sorting
      query = parameters.SortBy?.ToLower() switch
      {
        "name" => parameters.IsAscending
            ? query.OrderBy(e => e.Name)
            : query.OrderByDescending(e => e.Name),
        "dailyprice" => parameters.IsAscending
            ? query.OrderBy(e => e.DailyPrice)
            : query.OrderByDescending(e => e.DailyPrice),
        "createdat" => parameters.IsAscending
            ? query.OrderBy(e => e.CreatedAt)
            : query.OrderByDescending(e => e.CreatedAt),
        _ => query.OrderByDescending(e => e.CreatedAt)
      };

      // Get paginated data
      var paginatedList = await PaginatedList<Equipment>.CreateAsync(
          query,
          parameters.PageNumber,
          parameters.PageSize);

      // Convert to view DTO
      var items = await Task.WhenAll(
          paginatedList.Items.Select(MapToViewDtoAsync));

      return new ApiResponse<PaginatedList<EquipmentViewDto>>
      {
        Success = true,
        Data = new PaginatedList<EquipmentViewDto>(
              items.ToList(),
              paginatedList.TotalCount,
              paginatedList.PageNumber,
              paginatedList.PageSize)
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving user equipment list");
      return new ApiResponse<PaginatedList<EquipmentViewDto>>
      {
        Success = false,
        Message = "An error occurred while retrieving user equipment list"
      };
    }
  }
  // Update equipment information based on equipment id, first parameter is equipment id, second is the equipment information you want to update, third is the current logged-in user id
  public async Task<ApiResponse<EquipmentViewDto>> UpdateEquipmentAsync(
      string id,
      UpdateEquipmentRequest request,
      string ownerId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Get equipment information based on equipment id, and associated query out equipment owner user information
      var equipment = await _context.Equipment
          .Include(e => e.Owner)
          .FirstOrDefaultAsync(e => e.Id == id);

      if (equipment == null)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment does not exist"
        };
      }

      // Check permissions
      //👉 Check if the current logged-in user is the equipment owner
      //👉 If not, return error information
      if (equipment.OwnerId != ownerId)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "No permission to modify this equipment"
        };
      }

      // Check if trying to manually set to Rented status
      if (request.Status == EquipmentStatus.Rented)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment status can only be set to 'Rented' through the order system"
        };
      }

      // Check if currently in Rented status
      if (equipment.Status == EquipmentStatus.Rented)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Cannot modify equipment while it is rented"
        };
      }

      // Validate if status transition is legal
      if (!IsValidStatusTransition(equipment.Status, request.Status))
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = $"Invalid status transition from {equipment.Status} to {request.Status}"
        };
      }

      // Update equipment information
      equipment.Name = request.Name;
      equipment.Description = request.Description;
      equipment.DailyPrice = request.DailyPrice;
      equipment.Latitude = (decimal)request.Latitude;
      equipment.Longitude = (decimal)request.Longitude;
      equipment.Status = request.Status;
      equipment.Type = request.Type; // Add equipment type update

      // Handle image update (if there is a new image)
      if (request.Image != null)
      {
        // Delete old image first
        if (!string.IsNullOrEmpty(equipment.ImageUrl))
        {
          await _fileService.DeleteFileAsync(equipment.ImageUrl);
        }

        // Upload new image
        var uploadResult = await _fileService.UploadEquipmentImageAsync(request.Image, equipment.Id);
        if (uploadResult.Success && uploadResult.Data != null)
        {
          equipment.ImageUrl = uploadResult.Data.FileUrl;
        }
        else
        {
          // If new image upload fails, log warning but don't rollback update
          _logger.LogWarning("Failed to upload new equipment image for equipment {EquipmentId}: {Message}",
              equipment.Id, uploadResult.Message);
        }
      }

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<EquipmentViewDto>
      {
        Success = true,
        Message = "Equipment updated successfully",
        // Still convert to frontend-specific EquipmentViewDto type
        Data = await MapToViewDtoAsync(equipment)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "An error occurred while updating equipment");
      return new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while updating equipment"
      };
    }
  }
  // Delete equipment by equipment id, first parameter is equipment id, second is current logged-in user id, third is whether it's administrator
  public async Task<ApiResponse> DeleteEquipmentAsync(string id, string ownerId, bool isAdmin)
  {
    try
    {
      // Get equipment information by equipment id
      var equipment = await _context.Equipment
          .FirstOrDefaultAsync(e => e.Id == id);

      if (equipment == null)
      {
        return new ApiResponse
        {
          Success = false,
          Message = "Equipment does not exist"
        };
      }

      // Check permissions
      //👉 Check if the current logged-in user is the equipment owner
      //👉 If not, return error information
      if (!isAdmin && equipment.OwnerId != ownerId)
      {
        return new ApiResponse
        {
          Success = false,
          Message = "No permission to delete this equipment"
        };
      }

      // Check if there are active orders
      //👉 Check if the equipment has active orders
      //👉 If yes, return error information
      if (await HasActiveOrdersAsync(id))
      {
        return new ApiResponse
        {
          Success = false,
          Message = "Equipment has active orders and cannot be deleted"
        };
      }

      //👉 Delete associated image file (if any)
      if (!string.IsNullOrEmpty(equipment.ImageUrl))
      {
        await _fileService.DeleteFileAsync(equipment.ImageUrl);
      }

      //👉 Delete equipment
      _context.Equipment.Remove(equipment);
      await _context.SaveChangesAsync();

      return new ApiResponse
      {
        Success = true,
        Message = "Equipment deleted successfully"
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while deleting equipment");
      return new ApiResponse
      {
        Success = false,
        Message = "An error occurred while deleting equipment"
      };
    }
  }
  // This method is used to check if equipment has active orders, parameter is equipment id, currently not implemented, so returns false, needs to be implemented when order service is available in the future
  public async Task<bool> HasActiveOrdersAsync(string equipmentId)
  {
    try
    {
      return await _context.Orders.AnyAsync(o =>
        o.EquipmentId == equipmentId &&
        (o.Status == OrderStatus.Pending || o.Status == OrderStatus.Accepted || o.Status == OrderStatus.InProgress));
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error checking active orders for equipment {EquipmentId}", equipmentId);
      return false;
    }
  }
  // This method converts Equipment object to EquipmentViewDto object, that is, converts data from Equipment table to EquipmentViewDto table
  // EquipmentViewDto is a simplified or refactored data structure that only contains some necessary information of the equipment, not all information
  // This new data structure is used to return to the frontend in the Controller layer
  private async Task<EquipmentViewDto> MapToViewDtoAsync(Equipment equipment)
  {
    var owner = equipment.Owner ?? await _userManager.FindByIdAsync(equipment.OwnerId);

    return new EquipmentViewDto
    {
      Id = equipment.Id,
      Name = equipment.Name,
      Description = equipment.Description,
      DailyPrice = equipment.DailyPrice,
      Latitude = (double)equipment.Latitude,
      Longitude = (double)equipment.Longitude,
      Status = equipment.Status,
      OwnerId = equipment.OwnerId,
      // owner is user data queried from User table based on ownerId earlier
      OwnerUsername = owner?.UserName ?? string.Empty,
      Type = equipment.Type,
      ImageUrl = equipment.ImageUrl,
      CreatedAt = equipment.CreatedAt
    };
  }

  /// <inheritdoc/>
  public async Task<ApiResponse<EquipmentViewDto>> UpdateEquipmentStatusAsync(
      string id,
      UpdateEquipmentStatusRequest request,
      string ownerId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Get equipment information by equipment id
      var equipment = await _context.Equipment
          .Include(e => e.Owner)
          .FirstOrDefaultAsync(e => e.Id == id);

      if (equipment == null)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment does not exist"
        };
      }

      // Check permissions
      if (equipment.OwnerId != ownerId)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "No permission to modify this equipment"
        };
      }

      // Check if trying to manually set to Rented status
      if (request.Status == EquipmentStatus.Rented)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment status can only be set to 'Rented' through the order system"
        };
      }

      // Check if currently in Rented status
      if (equipment.Status == EquipmentStatus.Rented)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Cannot modify equipment while it is rented"
        };
      }

      // Validate if status transition is legal
      if (!IsValidStatusTransition(equipment.Status, request.Status))
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = $"Invalid status transition from {equipment.Status} to {request.Status}"
        };
      }

      // Only update status field
      equipment.Status = request.Status;

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      return new ApiResponse<EquipmentViewDto>
      {
        Success = true,
        Message = "Equipment status updated successfully",
        Data = await MapToViewDtoAsync(equipment)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "An error occurred while updating equipment status for equipment {EquipmentId}", id);
      return new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while updating equipment status"
      };
    }
  }

  /// <summary>
  /// Validate if equipment status transition is legal
  /// </summary>
  /// <param name="currentStatus">Current status</param>
  /// <param name="newStatus">New status</param>
  /// <returns>Whether legal</returns>
  private static bool IsValidStatusTransition(EquipmentStatus currentStatus, EquipmentStatus newStatus)
  {
    return (currentStatus, newStatus) switch
    {
      // Same status allowed (other fields may be updating)
      var (current, target) when current == target => true,

      // Available can be manually changed to Maintenance or Offline
      (EquipmentStatus.Available, EquipmentStatus.Maintenance) => true,
      (EquipmentStatus.Available, EquipmentStatus.Offline) => true,

      // PendingReturn can be changed to Available (confirm return)
      (EquipmentStatus.PendingReturn, EquipmentStatus.Available) => true,

      // Maintenance can be changed to Available or Offline
      (EquipmentStatus.Maintenance, EquipmentStatus.Available) => true,
      (EquipmentStatus.Maintenance, EquipmentStatus.Offline) => true,

      // Offline can be changed to Available or Maintenance
      (EquipmentStatus.Offline, EquipmentStatus.Available) => true,
      (EquipmentStatus.Offline, EquipmentStatus.Maintenance) => true,

      // Other transitions not allowed
      _ => false
    };
  }

  /// <summary>
  /// Confirm equipment return - new feature
  /// Confirm PendingReturn status equipment as Available, allow re-rental
  /// </summary>
  /// <param name="equipmentId">Equipment ID</param>
  /// <param name="ownerId">Equipment owner ID</param>
  /// <returns>Operation result</returns>
  public async Task<ApiResponse<EquipmentViewDto>> ConfirmEquipmentReturnAsync(string equipmentId, string ownerId)
  {
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
      // Get equipment information
      var equipment = await _context.Equipment
          .Include(e => e.Owner)
          .FirstOrDefaultAsync(e => e.Id == equipmentId);

      if (equipment == null)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment not found"
        };
      }

      // Check permissions
      if (equipment.OwnerId != ownerId)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "No permission to confirm return for this equipment"
        };
      }

      // Check if equipment is in pending return status
      if (equipment.Status != EquipmentStatus.PendingReturn)
      {
        return new ApiResponse<EquipmentViewDto>
        {
          Success = false,
          Message = "Equipment is not pending return"
        };
      }

      // Confirm return, equipment becomes available
      equipment.Status = EquipmentStatus.Available;

      await _context.SaveChangesAsync();
      await transaction.CommitAsync();

      _logger.LogInformation("Equipment {EquipmentId} return confirmed by owner {OwnerId}, now available for rent",
          equipmentId, ownerId);

      return new ApiResponse<EquipmentViewDto>
      {
        Success = true,
        Message = "Equipment return confirmed successfully",
        Data = await MapToViewDtoAsync(equipment)
      };
    }
    catch (Exception ex)
    {
      await transaction.RollbackAsync();
      _logger.LogError(ex, "Error confirming equipment return for {EquipmentId}", equipmentId);
      return new ApiResponse<EquipmentViewDto>
      {
        Success = false,
        Message = "An error occurred while confirming equipment return"
      };
    }
  }
}