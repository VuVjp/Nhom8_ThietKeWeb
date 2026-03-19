namespace HotelManagement.Entities;

public class RoomType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int CapacityAdults { get; set; }
    public int CapacityChildren { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();
    public ICollection<RoomImage> RoomImages { get; set; } = new List<RoomImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();
}
