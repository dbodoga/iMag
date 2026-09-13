using iMag.Api.DTOs;
using iMag.Api.Models;
using iMag.Api.Repositories;
namespace iMag.Api.Services;
public interface IOrderService
{
    Task<OrderDto> CreateAsync(Guid userId, CreateOrderRequest request, CancellationToken ct);
    Task<OrderDto> GetAsync(Guid userId, Guid id, CancellationToken ct);
    Task<PageDto<OrderDto>> ListAsync(Guid userId, int page, int pageSize, CancellationToken ct);
}
public sealed class OrderService(IOrderRepository orders, ICatalogRepository catalog) : IOrderService
{
    public async Task<OrderDto> CreateAsync(Guid userId, CreateOrderRequest request, CancellationToken ct)
    {
        if (request.RequestId == Guid.Empty || request.Items == null || request.Items.Count is < 1 or > 50 || request.Items.Any(x => x == null || x.Quantity is < 1 or > 99 || x.ProductId < 1)) throw new ApiException(400, "validation");
        if (request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count) throw new ApiException(400, "duplicateProduct");
        var previous = await orders.FindRequestAsync(userId, request.RequestId, ct);
        if (previous != null) return ValidateRetry(previous, request);
        var products = await catalog.FindProductsAsync(request.Items.Select(x => x.ProductId).ToArray(), ct);
        if (products.Count != request.Items.Count) throw new ApiException(400, "productUnavailable");
        var order = new Order { UserId = userId, RequestId = request.RequestId };
        foreach (var item in request.Items)
        {
            var product = products.Single(x => x.Id == item.ProductId);
            order.Items.Add(new OrderItem { ProductId = product.Id, ProductName = product.Name, Quantity = item.Quantity, UnitPrice = product.Price });
        }
        return ValidateRetry(await orders.AddAsync(order, ct), request);
    }
    private static OrderDto ValidateRetry(Order order, CreateOrderRequest request)
    {
        if (order.Items.Count != request.Items.Count || order.Items.Any(x => !request.Items.Any(r => r.ProductId == x.ProductId && r.Quantity == x.Quantity))) throw new ApiException(409, "requestConflict");
        return Map(order);
    }
    public async Task<OrderDto> GetAsync(Guid userId, Guid id, CancellationToken ct) => Map(await orders.FindAsync(userId, id, ct) ?? throw new ApiException(404, "notFound"));
    public async Task<PageDto<OrderDto>> ListAsync(Guid userId, int page, int pageSize, CancellationToken ct)
    {
        var (items, count) = await orders.ListAsync(userId, page, pageSize, ct);
        return new(items.Select(Map).ToList(), page, pageSize, count);
    }
    private static OrderDto Map(Order order) => new(order.Id, order.OrderedAt, order.Items.Sum(x => x.UnitPrice * x.Quantity), order.Items.OrderBy(x => x.ProductId).Select(x => new OrderItemDto(x.ProductId, x.ProductName, x.Quantity, x.UnitPrice, x.UnitPrice * x.Quantity)).ToList());
}
