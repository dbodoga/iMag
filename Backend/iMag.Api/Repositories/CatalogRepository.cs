using iMag.Api.Data;
using iMag.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace iMag.Api.Repositories;
public interface ICatalogRepository
{
    Task<List<Category>> CategoriesAsync(CancellationToken ct);
    Task<List<Product>> ProductsAsync(int? categoryId, CancellationToken ct);
    Task<List<Product>> FindProductsAsync(int[] ids, CancellationToken ct);
}
public sealed class CatalogRepository(AppDbContext db) : ICatalogRepository
{
    public Task<List<Category>> CategoriesAsync(CancellationToken ct) => db.Categories.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);
    public Task<List<Product>> ProductsAsync(int? categoryId, CancellationToken ct) => db.Products.AsNoTracking().Where(x => categoryId == null || x.CategoryId == categoryId).OrderBy(x => x.Id).ToListAsync(ct);
    public Task<List<Product>> FindProductsAsync(int[] ids, CancellationToken ct) => db.Products.AsNoTracking().Where(x => ids.Contains(x.Id)).ToListAsync(ct);
}
