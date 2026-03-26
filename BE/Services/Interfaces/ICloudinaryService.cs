public interface ICloudinaryService
{
    Task<string> UploadImageAsync(IFormFile file, string folder, string publicId = null!);
    Task<string> UploadVideoAsync(IFormFile file, string folder, string publicId = null!);
    Task<bool> DeleteFileAsync(string publicId);
}