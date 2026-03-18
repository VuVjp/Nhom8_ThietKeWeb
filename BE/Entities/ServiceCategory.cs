namespace HotelManagement.Entities;

public class ServiceCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Service> Services { get; set; } = new List<Service>();
}
