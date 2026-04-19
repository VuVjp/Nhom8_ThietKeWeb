using HotelManagement.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [Permission(PermissionNames.ViewDashboard)]
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AuditLogQueryDto query, CancellationToken cancellationToken)
    {
        var logs = await _auditLogService.GetAllAsync(query, cancellationToken);
        return Ok(logs);
    }

    [Permission(PermissionNames.ViewDashboard)]
    [Authorize]
    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged([FromQuery] AuditLogQueryDto query, CancellationToken cancellationToken)
    {
        var logs = await _auditLogService.GetPagedAsync(query, cancellationToken);
        return Ok(logs);
    }
}
