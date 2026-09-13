namespace iMag.Api.Models;
public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public Guid RequestId { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
}
