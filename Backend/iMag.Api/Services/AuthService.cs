using iMag.Api.DTOs;
using iMag.Api.Models;
using iMag.Api.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
namespace iMag.Api.Services;
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct);
}
public sealed class AuthService(IUserRepository users, IPasswordHasher<User> hasher, ITokenService tokens) : IAuthService
{
    private static readonly User Dummy = new();
    private static readonly string DummyHash = new PasswordHasher<User>().HashPassword(Dummy, Guid.NewGuid().ToString());
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (name.Length < 2) throw new ApiException(400, "validation");
        var email = request.Email.Trim().ToLowerInvariant();
        if (await users.FindByEmailAsync(email, ct) != null) throw new ApiException(409, "emailExists");
        var user = new User { Name = name, Email = email };
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        try { await users.AddAsync(user, ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation }) { throw new ApiException(409, "emailExists"); }
        return tokens.Create(user);
    }
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await users.FindByEmailAsync(request.Email.Trim().ToLowerInvariant(), ct);
        var result = hasher.VerifyHashedPassword(user ?? Dummy, user?.PasswordHash ?? DummyHash, request.Password);
        if (user == null || result == PasswordVerificationResult.Failed) throw new ApiException(401, "invalidCredentials");
        if (result == PasswordVerificationResult.SuccessRehashNeeded) { user.PasswordHash = hasher.HashPassword(user, request.Password); await users.SaveAsync(ct); }
        return tokens.Create(user);
    }
}
