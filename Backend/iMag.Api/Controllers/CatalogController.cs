using iMag.Api.DTOs;
using iMag.Api.Services;
using Microsoft.AspNetCore.Mvc;
namespace iMag.Api.Controllers;
[ApiController, Route("api")]
public sealed class CatalogController(ICatalogService service) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> Categories(CancellationToken ct) => Ok(await service.CategoriesAsync(ct));
    [HttpGet("products")]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> Products([FromQuery] int? categoryId, CancellationToken ct) => Ok(await service.ProductsAsync(categoryId, ct));
}
