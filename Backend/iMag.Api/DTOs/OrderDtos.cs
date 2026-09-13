using System.ComponentModel.DataAnnotations;
namespace iMag.Api.DTOs;
public sealed record CreateOrderItemRequest([Range(1, int.MaxValue)] int ProductId, [Range(1, 99)] int Quantity);
public sealed record CreateOrderRequest(
    Guid RequestId,
    [Required, MinLength(1), MaxLength(50)] List<CreateOrderItemRequest> Items);
public sealed record OrderItemDto(int ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
public sealed record OrderDto(Guid Id, DateTime OrderedAt, decimal Total, IReadOnlyList<OrderItemDto> Items);
public sealed record PageDto<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
