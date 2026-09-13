namespace iMag.Api.DTOs;
public sealed record CategoryDto(int Id, string Name, string NameEn);
public sealed record ProductDto(int Id, string Name, string Description, string DescriptionEn, decimal Price, int CategoryId);
