using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _repository;

    public ReviewService(IReviewRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ReviewDto>> GetAllAsync()
    {
        var reviews = await _repository.GetAllWithDetailsAsync();
        return reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            UserId = r.UserId,
            UserName = r.User?.FullName,
            UserAvatarUrl = r.User?.AvatarUrl,
            RoomTypeId = r.RoomTypeId,
            RoomTypeName = r.RoomType?.Name,
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt,
            IsActive = r.IsActive
        });
    }

    public async Task<PaginatedResultDto<ReviewDto>> GetPagedAsync(ReviewQueryDto query)
    {
        var queryable = _repository.GetQueryable()
            .Include(r => r.User)
            .Include(r => r.RoomType)
            .AsNoTracking();

        // Search by ID or UserName
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchTerm = query.Search.Trim().ToLower();
            if (int.TryParse(searchTerm, out var id))
            {
                queryable = queryable.Where(r => r.Id == id || (r.User != null && r.User.FullName.ToLower().Contains(searchTerm)));
            }
            else
            {
                queryable = queryable.Where(r => r.User != null && r.User.FullName.ToLower().Contains(searchTerm));
            }
        }

        if (query.RoomTypeId.HasValue)
        {
            queryable = queryable.Where(r => r.RoomTypeId == query.RoomTypeId.Value);
        }

        if (query.Rating.HasValue)
        {
            queryable = queryable.Where(r => r.Rating == query.Rating.Value);
        }



        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(r => r.CreatedAt.HasValue && r.CreatedAt.Value >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(r => r.CreatedAt.HasValue && r.CreatedAt.Value <= query.EndDate.Value);
        }

        if (query.IsActive.HasValue)
        {
            queryable = queryable.Where(r => r.IsActive == query.IsActive.Value);
        }

        // Sorting
        queryable = query.SortOrder?.ToLower() == "asc"
            ? queryable.OrderBy(r => r.Id)
            : queryable.OrderByDescending(r => r.Id);

        var total = await queryable.CountAsync();
        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : "Anonymous",
                UserAvatarUrl = r.User != null ? r.User.AvatarUrl : null,
                RoomTypeId = r.RoomTypeId,
                RoomTypeName = r.RoomType != null ? r.RoomType.Name : "N/A",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                IsActive = r.IsActive
            })
            .ToListAsync();

        return new PaginatedResultDto<ReviewDto>
        {
            Items = items,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<ReviewDto?> GetByIdAsync(int id)
    {
        var review = await _repository.GetByIdWithDetailsAsync(id);
        if (review == null) return null;

        return new ReviewDto
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = review.User?.FullName,
            UserAvatarUrl = review.User?.AvatarUrl,
            RoomTypeId = review.RoomTypeId,
            RoomTypeName = review.RoomType?.Name,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
            IsActive = review.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var review = await _repository.GetByIdAsync(id);
        if (review == null) return false;

        _repository.Delete(review);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var review = await _repository.GetByIdAsync(id);
        if (review == null) return false;

        review.IsActive = !review.IsActive;
        _repository.Update(review);
        await _repository.SaveChangesAsync();
        return true;
    }
}
