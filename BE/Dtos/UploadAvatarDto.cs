namespace HotelManagement.Dtos
{
    public class UploadAvatarDto
    {
        public string? AvatarUrl { get; set; }
        public IFormFile? AvatarFile { get; set; }
    }
}