using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using iMag.Api.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Xunit;

namespace iMag.Tests;
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string database = "imag_test_" + Guid.NewGuid().ToString("N");
    private readonly string master = Environment.GetEnvironmentVariable("IMAG_TEST_DB")
        ?? "Host=localhost;Port=5433;Database=postgres;Username=imag;Password=imag_local_dev";
    public string ConnectionString => new NpgsqlConnectionStringBuilder(master) { Database = database }.ConnectionString;
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?> {
            ["ConnectionStrings:Default"] = ConnectionString,
            ["Database:Initialize"] = "true",
            ["Jwt:Key"] = "only-for-isolated-automated-tests-0123456789abcdef"
        }));
    }
    public async Task InitializeAsync()
    {
        await using var connection = new NpgsqlConnection(master);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"CREATE DATABASE \"{database}\"", connection);
        await command.ExecuteNonQueryAsync();
    }
    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        NpgsqlConnection.ClearAllPools();
        await using var connection = new NpgsqlConnection(master);
        await connection.OpenAsync();
        // Only the unique database created by this fixture is ever removed.
        await using var command = new NpgsqlCommand($"DROP DATABASE \"{database}\" WITH (FORCE)", connection);
        await command.ExecuteNonQueryAsync();
    }
}
public sealed class ApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private async Task<(HttpClient Client, AuthResponse Auth)> Account()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { name = "Test User", email = $"{Guid.NewGuid():N}@example.test", password = "Strong-test-password" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
        client.DefaultRequestHeaders.Authorization = new("Bearer", auth.Token);
        return (client, auth);
    }
    [Fact]
    public async Task Catalog_is_public_seeded_filterable_and_does_not_expose_entities()
    {
        using var client = factory.CreateClient();
        var categories = (await client.GetFromJsonAsync<List<CategoryDto>>("/api/categories"))!;
        Assert.Equal(3, categories.Count);
        var products = (await client.GetFromJsonAsync<List<ProductDto>>("/api/products"))!;
        Assert.Equal(6, products.Count);
        Assert.Contains(products, p => p.Name == "iPhone 17");
        Assert.Contains(products, p => p.Name == "MacBook Pro M4");
        Assert.Contains(products, p => p.Name == "AirPods Pro");
        var phones = (await client.GetFromJsonAsync<List<ProductDto>>("/api/products?categoryId=1"))!;
        Assert.All(phones, p => Assert.Equal(1, p.CategoryId));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/orders", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/swagger/v1/swagger.json")).StatusCode);
    }
    [Fact]
    public async Task Register_login_normalization_hashing_and_token_validation_work()
    {
        var (client, auth) = await Account(); using var owned = client;
        var duplicate = await client.PostAsJsonAsync("/api/auth/register", new { name = "Other User", email = auth.User.Email.ToUpperInvariant(), password = "Strong-test-password" });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        var invalid = await client.PostAsJsonAsync("/api/auth/login", new { email = auth.User.Email, password = "Wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, invalid.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email = auth.User.Email.ToUpperInvariant(), password = "Strong-test-password" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var body = await login.Content.ReadAsStringAsync();
        Assert.DoesNotContain("password", body, StringComparison.OrdinalIgnoreCase);
        await using var db = new NpgsqlConnection(factory.ConnectionString); await db.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT \"PasswordHash\" FROM \"Users\" WHERE \"Id\"=@id", db);
        command.Parameters.AddWithValue("id", auth.User.Id);
        var hash = (string)(await command.ExecuteScalarAsync())!;
        Assert.NotEqual("Strong-test-password", hash);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "invalid.jwt.token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/orders")).StatusCode);
        var expired = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken("iMag.Api", "iMag.Web",
            [new System.Security.Claims.Claim("sub", auth.User.Id.ToString())],
            DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1),
            new Microsoft.IdentityModel.Tokens.SigningCredentials(new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes("only-for-isolated-automated-tests-0123456789abcdef")), Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256));
        client.DefaultRequestHeaders.Authorization = new("Bearer", new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(expired));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/orders")).StatusCode);
    }
    [Fact]
    public async Task Orders_use_server_prices_preserve_snapshots_and_are_private()
    {
        var (client, _) = await Account(); using var owned = client;
        var (other, _) = await Account(); using var otherOwned = other;
        var request = new { requestId = Guid.NewGuid(), items = new[] { new { productId = 1, quantity = 2, unitPrice = 0.01m } }, userId = Guid.NewGuid() };
        var response = await client.PostAsJsonAsync("/api/orders", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = (await response.Content.ReadFromJsonAsync<OrderDto>())!;
        Assert.Equal(9598m, order.Total);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/orders/{order.Id}")).StatusCode);
        Assert.Empty((await other.GetFromJsonAsync<PageDto<OrderDto>>("/api/orders"))!.Items);
        await using var db = new NpgsqlConnection(factory.ConnectionString); await db.OpenAsync();
        await using (var command = new NpgsqlCommand("UPDATE \"Products\" SET \"Price\"=5000, \"Name\"='Changed name' WHERE \"Id\"=1", db)) await command.ExecuteNonQueryAsync();
        var saved = (await client.GetFromJsonAsync<OrderDto>($"/api/orders/{order.Id}"))!;
        Assert.Equal(9598m, saved.Total); Assert.Equal("iPhone 17", saved.Items[0].ProductName);
        await using (var command = new NpgsqlCommand("UPDATE \"Products\" SET \"Price\"=4799, \"Name\"='iPhone 17' WHERE \"Id\"=1", db)) await command.ExecuteNonQueryAsync();
        Assert.Single((await client.GetFromJsonAsync<PageDto<OrderDto>>("/api/orders?page=1&pageSize=1"))!.Items);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/orders?page=0")).StatusCode);
    }
    [Fact]
    public async Task Invalid_orders_are_rejected_atomically()
    {
        var (client, _) = await Account(); using var owned = client;
        object[] invalidBodies = [
            new { requestId = Guid.NewGuid(), items = Array.Empty<object>() },
            new { requestId = Guid.NewGuid(), items = new[] { new { productId = 1, quantity = 0 } } },
            new { requestId = Guid.NewGuid(), items = new[] { new { productId = 1, quantity = 100 } } },
            new { requestId = Guid.NewGuid(), items = new[] { new { productId = 1, quantity = 1 }, new { productId = 999999, quantity = 1 } } },
            new { requestId = Guid.NewGuid(), items = new[] { new { productId = 1, quantity = 1 }, new { productId = 1, quantity = 1 } } },
            new { requestId = Guid.Empty, items = new[] { new { productId = 1, quantity = 1 } } },
            new { requestId = Guid.NewGuid(), items = new object?[] { null } }
        ];
        foreach (var body in invalidBodies) Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/orders", body)).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<PageDto<OrderDto>>("/api/orders"))!.Items);
    }
    [Fact]
    public async Task Retrying_or_concurrently_submitting_an_order_does_not_duplicate_it()
    {
        var (client, _) = await Account(); using var owned = client;
        var requestId = Guid.NewGuid();
        var body = new { requestId, items = new[] { new { productId = 5, quantity = 2 } } };
        var responses = await Task.WhenAll(client.PostAsJsonAsync("/api/orders", body), client.PostAsJsonAsync("/api/orders", body));
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        var orders = await Task.WhenAll(responses.Select(async r => (await r.Content.ReadFromJsonAsync<OrderDto>())!));
        Assert.Equal(orders[0].Id, orders[1].Id);
        Assert.Single((await client.GetFromJsonAsync<PageDto<OrderDto>>("/api/orders"))!.Items);
        var conflict = await client.PostAsJsonAsync("/api/orders", new { requestId, items = new[] { new { productId = 5, quantity = 3 } } });
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
    }
}
