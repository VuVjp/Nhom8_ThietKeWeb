using System.Security.Claims;
using HotelManagement.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly AppDbContext _context;

    public PermissionHandler(AppDbContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (!context.User.Identity?.IsAuthenticated ?? false)
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null)
            throw new UnauthorizedAccessException("User ID claim not found.");

        var userId = int.Parse(userIdClaim.Value);

        if (context.User.FindFirst(ClaimTypes.Role)?.Value == "Admin")
        {
            context.Succeed(requirement);
            return;
        }

        var rawPermissionNames = await _context.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Role!.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .ToListAsync();

        var normalizedUserPermissions = rawPermissionNames
            .Where(permission => !string.IsNullOrWhiteSpace(permission))
            .Select(permission => permission.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var hasPermission = normalizedUserPermissions.Contains(requirement.Permission.Trim());

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
        else
        {
            throw new ForbiddenException("User does not have the required permission.");
        }
    }
}