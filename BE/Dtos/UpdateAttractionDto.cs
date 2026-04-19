public class UpdateAttractionDto 
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? DistanceKm { get; set; }
    public bool? IsActive { get; set; }
    public string? MapEmbedLink { get; set; }

    public string Latitude { get; set; } = string.Empty;
    public string Longitude { get; set; } = string.Empty;
}