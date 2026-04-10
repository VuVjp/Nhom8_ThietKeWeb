using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardOverviewDto> GetOverviewAsync(int days = 7);
}