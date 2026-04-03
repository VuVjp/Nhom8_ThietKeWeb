public interface IAmenityService
{
    Task<IEnumerable<AmenityDto>> GetAllAsync();
    Task<AmenityDto?> GetByIdAsync(int id);
    Task<bool> CreateAsync(CreateAmenityRequestDto dto);
    Task<bool> UpdateAsync(int id, UpdateAmenityDto dto);
    Task<bool> ToggleActiveAsync(int id);
}