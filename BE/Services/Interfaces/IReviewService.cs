using HotelManagement.Dtos;

namespace HotelManagement.Services.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> GetAllAsync();
    Task<PaginatedResultDto<ReviewDto>> GetPagedAsync(ReviewQueryDto query);
    Task<ReviewDto?> GetByIdAsync(int id);
    Task<bool> DeleteAsync(int id);
    Task<bool> ToggleActiveAsync(int id);
}
