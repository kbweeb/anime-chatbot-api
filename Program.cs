using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Enable CORS for cross-origin requests
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Enable CORS
app.UseCors("AllowAll");

// Shared chat handler logic
static async Task HandleChatRequest(HttpContext ctx)
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var message = body.TryGetProperty("message", out var m) ? m.GetString() ?? string.Empty : string.Empty;

    // Provider-agnostic envs (defaults target Groq's OpenAI-compatible endpoint)
    var apiKey = Environment.GetEnvironmentVariable("AI_API_KEY")
                ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    var baseUrl = Environment.GetEnvironmentVariable("AI_BASE_URL") ?? "https://api.groq.com/openai/v1";
    var model = Environment.GetEnvironmentVariable("AI_MODEL") ?? "llama-3.1-70b-versatile";

    if (string.IsNullOrWhiteSpace(apiKey))
    {
        var mock = "(Mock) Hello from Anime Chatbot! Set AI_API_KEY on the server to enable real replies.";
        await ctx.Response.WriteAsJsonAsync(new { reply = mock });
        return;
    }

    // Ensure BaseAddress retains the "/openai/v1" path and do not use a leading slash in requests
    using var http = new HttpClient { BaseAddress = new Uri(baseUrl.EndsWith("/") ? baseUrl : baseUrl + "/") };
    http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
    var payload = new
    {
        model,
        messages = new[] { new { role = "user", content = message } },
        temperature = 0.7,
        max_tokens = 256,
    };
    var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    try
    {
        var res = await http.PostAsync("chat/completions", content);
        res.EnsureSuccessStatusCode();
        using var stream = await res.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        var root = doc.RootElement;
        var reply = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
        await ctx.Response.WriteAsJsonAsync(new { reply });
    }
    catch (Exception ex)
    {
        await ctx.Response.WriteAsJsonAsync(new { reply = $"(Error) {ex.Message}" });
    }
}

// Register both route patterns to handle frontend expectations
app.MapPost("/chat", HandleChatRequest);        // Original route
app.MapPost("/api/chat", HandleChatRequest);    // Frontend-expected route

app.Run();
