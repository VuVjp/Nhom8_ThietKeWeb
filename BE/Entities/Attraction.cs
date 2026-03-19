namespace HotelManagement.Entities;

public class Attraction
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? DistanceKm { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string? MapEmbedLink { get; set; }
    public string Longitude { get; set; } = string.Empty;
    public string Latitude { get; set; } = string.Empty;
}
