namespace HotelManagement.Dtos;

public class MembershipDto {
    public int Id { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int? MinPoints { get; set; }
    public decimal? DiscountPercent { get; set; }
}

public class UpdateMembershipDto {
    public string TierName { get; set; } = string.Empty;
    public int MinPoints { get; set; }
    public decimal DiscountPercent { get; set; }
}