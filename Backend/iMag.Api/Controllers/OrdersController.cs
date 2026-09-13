using System.ComponentModel.DataAnnotations;
using iMag.Api.DTOs;
using iMag.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace iMag.Api.Controllers;
[ApiController, Route("api/orders"), Authorize]
public sealed class OrdersController(IOrderService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirst("sub")!.Value);
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequest request, CancellationToken ct)
    {
        var order = await service.CreateAsync(UserId, request, ct);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
    }
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> Get(Guid id, CancellationToken ct) => Ok(await service.GetAsync(UserId, id, ct));
    [HttpGet]
    public async Task<ActionResult<PageDto<OrderDto>>> List(CancellationToken ct, [FromQuery, Range(1, 1000000)] int page = 1, [FromQuery, Range(1, 50)] int pageSize = 10) => Ok(await service.ListAsync(UserId, page, pageSize, ct));
}
