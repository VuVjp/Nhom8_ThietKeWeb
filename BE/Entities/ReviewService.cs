public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> GetByRoomIdAsync(int roomId);
    Task<ReviewDto> CreateAsync(int userId, CreateReviewDto dto);
    Task<bool> DeleteAsync(int id, int userId);
}