// Đăng ký module RoomInventory
builder.Services.AddScoped<IRoomInventoryRepository, RoomInventoryRepository>();
builder.Services.AddScoped<IRoomInventoryService, RoomInventoryService>();