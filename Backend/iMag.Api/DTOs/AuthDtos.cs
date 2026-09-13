using System.ComponentModel.DataAnnotations;
namespace iMag.Api.DTOs;
public sealed record RegisterRequest(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128, MinimumLength = 10)] string Password);
public sealed record LoginRequest(
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128)] string Password);
public sealed record UserDto(Guid Id, string Name, string Email);
public sealed record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);
