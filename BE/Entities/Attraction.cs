namespace HotelManagement.Entities;

public class Attraction
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? DistanceKm { get; set; }
    public string? Description { get; set; }
    public string? MapEmbedLink { get; set; }
}
