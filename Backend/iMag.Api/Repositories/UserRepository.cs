using iMag.Api.Data;
using iMag.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace iMag.Api.Repositories;
public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email, CancellationToken ct);
    Task AddAsync(User user, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}
public sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> FindByEmailAsync(string email, CancellationToken ct) => db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
    public async Task AddAsync(User user, CancellationToken ct) { db.Users.Add(user); await db.SaveChangesAsync(ct); }
    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
