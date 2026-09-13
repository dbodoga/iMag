using iMag.Api.Data;
using iMag.Api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
namespace iMag.Api.Repositories;
public interface IOrderRepository
{
    Task<Order?> FindRequestAsync(Guid userId, Guid requestId, CancellationToken ct);
    Task<Order?> FindAsync(Guid userId, Guid id, CancellationToken ct);
    Task<(List<Order> Items, int Count)> ListAsync(Guid userId, int page, int pageSize, CancellationToken ct);
    Task<Order> AddAsync(Order order, CancellationToken ct);
}
public sealed class OrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> FindRequestAsync(Guid userId, Guid requestId, CancellationToken ct) => db.Orders.AsNoTracking().Include(x => x.Items).SingleOrDefaultAsync(x => x.UserId == userId && x.RequestId == requestId, ct);
    public Task<Order?> FindAsync(Guid userId, Guid id, CancellationToken ct) => db.Orders.AsNoTracking().Include(x => x.Items).SingleOrDefaultAsync(x => x.UserId == userId && x.Id == id, ct);
    public async Task<(List<Order>, int)> ListAsync(Guid userId, int page, int pageSize, CancellationToken ct)
    {
        var query = db.Orders.AsNoTracking().Where(x => x.UserId == userId);
        var count = await query.CountAsync(ct);
        return (await query.Include(x => x.Items).OrderByDescending(x => x.OrderedAt).ThenBy(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct), count);
    }
    public async Task<Order> AddAsync(Order order, CancellationToken ct)
    {
        db.Orders.Add(order);
        try { await db.SaveChangesAsync(ct); return order; }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // A concurrent retry may have already saved this request atomically.
            db.ChangeTracker.Clear();
            return await FindRequestAsync(order.UserId, order.RequestId, ct) ?? throw new InvalidOperationException("Order conflict.", ex);
        }
    }
}
