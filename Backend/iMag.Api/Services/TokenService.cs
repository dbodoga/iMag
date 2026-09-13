using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using iMag.Api.DTOs;
using iMag.Api.Models;
using Microsoft.IdentityModel.Tokens;
namespace iMag.Api.Services;
public sealed record JwtSettings(string Key, string Issuer, string Audience, int ExpirationMinutes);
public interface ITokenService { AuthResponse Create(User user); }
public sealed class TokenService(JwtSettings settings) : ITokenService
{
    public AuthResponse Create(User user)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(settings.ExpirationMinutes);
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience,
            [new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())],
            now, expires, new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)), SecurityAlgorithms.HmacSha256));
        return new(new JwtSecurityTokenHandler().WriteToken(token), expires, new(user.Id, user.Name, user.Email));
    }
}
