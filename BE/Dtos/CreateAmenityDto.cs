using System.Text.Json.Serialization;
using Microsoft.Identity.Client;

public class CreateAmenityRequestDto
{
    public string Name { get; set; } = string.Empty;
    public IFormFile? File { get; set; }
}

public class CreateAmenityResponseDto
{
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
}