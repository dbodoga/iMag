using iMag.Api.DTOs;
using iMag.Api.Repositories;
namespace iMag.Api.Services;
public interface ICatalogService
{
    Task<IReadOnlyList<CategoryDto>> CategoriesAsync(CancellationToken ct);
    Task<IReadOnlyList<ProductDto>> ProductsAsync(int? categoryId, CancellationToken ct);
}
public sealed class CatalogService(ICatalogRepository repository) : ICatalogService
{
    public async Task<IReadOnlyList<CategoryDto>> CategoriesAsync(CancellationToken ct) => (await repository.CategoriesAsync(ct)).Select(x => new CategoryDto(x.Id, x.Name, x.NameEn)).ToList();
    public async Task<IReadOnlyList<ProductDto>> ProductsAsync(int? categoryId, CancellationToken ct) => (await repository.ProductsAsync(categoryId, ct)).Select(x => new ProductDto(x.Id, x.Name, x.Description, x.DescriptionEn, x.Price, x.CategoryId)).ToList();
}
