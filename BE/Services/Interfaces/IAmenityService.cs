public interface IAmenityService
{
    Task<IEnumerable<AmenityDto>> GetAllAsync();
    Task<AmenityDto?> GetByIdAsync(int id);
    Task<AmenityDto> CreateAsync(CreateAmenityDto dto);
    Task<bool> UpdateAsync(int id, UpdateAmenityDto dto);
    Task<bool> DeleteAsync(int id);
}