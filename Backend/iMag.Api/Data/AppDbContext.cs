using iMag.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace iMag.Api.Data;
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e => {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(254);
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.PasswordHash).HasMaxLength(512);
        });
        b.Entity<Category>(e => {
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.NameEn).HasMaxLength(100);
        });
        b.Entity<Product>(e => {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.DescriptionEn).HasMaxLength(2000);
            e.Property(x => x.Price).HasPrecision(12, 2);
            e.ToTable(t => t.HasCheckConstraint("CK_Product_Price", "\"Price\" >= 0"));
            e.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<Order>(e => {
            e.HasIndex(x => new { x.UserId, x.RequestId }).IsUnique();
            e.HasIndex(x => new { x.UserId, x.OrderedAt });
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<OrderItem>(e => {
            e.Property(x => x.UnitPrice).HasPrecision(12, 2);
            e.Property(x => x.ProductName).HasMaxLength(200);
            e.HasIndex(x => new { x.OrderId, x.ProductId }).IsUnique();
            e.ToTable(t => { t.HasCheckConstraint("CK_Item_Quantity", "\"Quantity\" BETWEEN 1 AND 99"); t.HasCheckConstraint("CK_Item_Price", "\"UnitPrice\" >= 0"); });
            e.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });
        SeedData.Configure(b);
    }
}
