public class UpdateRoomTypeDto

{
    public string Name { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int CapacityAdults { get; set; }
    public int CapacityChildren { get; set; }
    public string? Description { get; set; }
    public string? View { get; set; }
    public string? BedType { get; set; }
    public int? SizeM2 { get; set; }
    public IList<IFormFile>? Files { get; set; }
}