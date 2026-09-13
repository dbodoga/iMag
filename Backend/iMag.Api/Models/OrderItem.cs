namespace iMag.Api.Models;
public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    // Historical snapshots: catalog edits must not change an existing order.
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; } = "";
}
