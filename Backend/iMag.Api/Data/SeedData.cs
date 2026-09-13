using iMag.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace iMag.Api.Data;
public static class SeedData
{
    // Illustrative RON prices, not live offers. Migration seeding is repeatable.
    public static void Configure(ModelBuilder b)
    {
        b.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Telefoane", NameEn = "Phones" },
            new Category { Id = 2, Name = "Laptopuri", NameEn = "Laptops" },
            new Category { Id = 3, Name = "Accesorii", NameEn = "Accessories" });
        b.Entity<Product>().HasData(
            Product(1, "iPhone 17", "Un nou ritm pentru fiecare zi.", "A fresh rhythm for every day.", 4799m, 1),
            Product(2, "Samsung Galaxy S25", "Idei mari, într-un format compact.", "Big ideas in a compact form.", 3999m, 1),
            Product(3, "MacBook Pro M4", "Spațiul tău pentru proiecte ambițioase.", "Your space for ambitious projects.", 8999m, 2),
            Product(4, "ASUS Zenbook 14", "Creativitate oriunde te poartă ziua.", "Creativity wherever the day takes you.", 5499m, 2),
            Product(5, "AirPods Pro", "Mai aproape de muzica preferată.", "Closer to the music you love.", 1199m, 3),
            Product(6, "Logitech MX Master 3S", "Confort și precizie pentru biroul tău.", "Comfort and precision for your desk.", 499m, 3));
    }
    private static Product Product(int id, string name, string ro, string en, decimal price, int category) =>
        new() { Id = id, Name = name, Description = ro, DescriptionEn = en, Price = price, CategoryId = category };
}
