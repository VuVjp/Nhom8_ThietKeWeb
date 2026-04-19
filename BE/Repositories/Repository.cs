using HotelManagement.Data;
using Microsoft.EntityFrameworkCore;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }
    public virtual async Task<T?> GetByNameAsync(string name)
    {
        return await _dbSet.FirstOrDefaultAsync(e => EF.Property<string>(e, "Name") == name);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
    }

    public async Task SoftDeleteAsync(T entity)
    {
        var property = typeof(T).GetProperty("IsActive");
        if (property != null && property.PropertyType == typeof(bool))
        {
            property.SetValue(entity, false);
            _dbSet.Update(entity);
            await SaveChangesAsync();
        }
        else
        {
            throw new InvalidOperationException("Soft delete is not supported for this entity.");
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}