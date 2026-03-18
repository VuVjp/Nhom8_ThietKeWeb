// --- Đăng ký Repository (Tầng dữ liệu) ---
// Dùng Scoped vì mỗi request cần một phiên làm việc Database riêng
builder.Services.AddScoped<IAttractionRepository, AttractionRepository>();

// --- Đăng ký Service (Tầng logic) ---
// Dùng Scoped để giải phóng bộ nhớ sau khi xử lý xong một Request
builder.Services.AddScoped<IAttractionService, AttractionService>();