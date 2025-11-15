using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapPost("/chat", async (HttpContext ctx) => {
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var message = body.TryGetProperty("message", out var m) ? m.GetString() ?? string.Empty : string.Empty;
    var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    string reply;
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        reply = "(Mock) Hello from Anime Chatbot! Ask for recommendations or summaries.";
    }
    else
    {
        // TODO: Replace with actual OpenAI call using HttpClient
        reply = $"(Demo) You said: {message}";
    }
    await ctx.Response.WriteAsJsonAsync(new { reply });
});

app.Run();
