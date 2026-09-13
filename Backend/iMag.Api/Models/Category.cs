namespace iMag.Api.Models;
public sealed class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string NameEn { get; set; } = "";
    public ICollection<Product> Products { get; set; } = [];
}
