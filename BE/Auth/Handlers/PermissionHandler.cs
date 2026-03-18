using HotelManagement.Data;
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
        var userIdClaim = context.User.FindFirst("sub");

        if (userIdClaim == null)
            return;

        var userId = int.Parse(userIdClaim.Value);

        var hasPermission = await _context.Users
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Role!.RolePermissions)
            .AnyAsync(rp => rp.Permission.Name == requirement.Permission);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}