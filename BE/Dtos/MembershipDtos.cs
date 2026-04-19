using System.Collections.Generic;

namespace HotelManagement.Dtos;

public class MembershipDto
{
    public int Id { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int? MinPoints { get; set; }
    public decimal? DiscountPercent { get; set; }
    public bool IsActive { get; set; }
}

public class CreateMembershipDto
{
    public string TierName { get; set; } = string.Empty;
    public int? MinPoints { get; set; }
    public decimal? DiscountPercent { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateMembershipDto
{
    public string TierName { get; set; } = string.Empty;
    public int? MinPoints { get; set; }
    public decimal? DiscountPercent { get; set; }
    public bool IsActive { get; set; }
}
