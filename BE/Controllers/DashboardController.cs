using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("overview")]
    [Permission(PermissionNames.ViewDashboard)]
    public async Task<IActionResult> GetOverview([FromQuery] int days = 7)
    {
        var data = await _dashboardService.GetOverviewAsync(days);
        return Ok(data);
    }
}