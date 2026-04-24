namespace HotelManagement.Dtos
{
    public class UserDto
    {
        public int Id { get; set; }
        public string? Email { get; set; } = null!;
        public string? RoleName { get; set; } = null!;
        public bool? IsActive { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? Birthday { get; set; }
        public int BirthdayUpdateCount { get; set; }
    }
    public class validateUserResponseDto
    {
        public string? FullName { get; set; } = null!;
        public string? Phone { get; set; } = null!;
        public string? Email { get; set; } = null!;
        public string? MembershipTierName { get; set; }
        public decimal DiscountPercent { get; set; }
    }
}