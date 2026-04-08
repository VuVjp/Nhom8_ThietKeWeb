using HotelManagement.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Amenity> Amenities { get; set; }
    public DbSet<ArticleCategory> ArticleCategories { get; set; }
    public DbSet<Article> Articles { get; set; }
    public DbSet<ArticleCategoryMap> ArticleCategoryMaps { get; set; }
    public DbSet<Attraction> Attractions { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<BookingDetail> BookingDetails { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Equipment> Equipments { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<LossAndDamage> LossAndDamages { get; set; }
    public DbSet<Membership> Memberships { get; set; }
    public DbSet<OrderServiceDetail> OrderServiceDetails { get; set; }
    public DbSet<OrderService> OrderServices { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<RoomImage> RoomImages { get; set; }
    public DbSet<RoomInventory> RoomInventories { get; set; }
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<RoomTypeAmenity> RoomTypeAmenities { get; set; }
    public DbSet<ServiceCategory> ServiceCategories { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Voucher> Vouchers { get; set; }

    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Notification>()
        .Property(n => n.Type)
        .HasConversion<string>();

        // Table name mappings
        modelBuilder.Entity<Amenity>().ToTable("Amenities");
        modelBuilder.Entity<ArticleCategory>().ToTable("Article_Categories");
        modelBuilder.Entity<Article>().ToTable("Articles");
        modelBuilder.Entity<ArticleCategoryMap>().ToTable("Article_Category_Map");
        modelBuilder.Entity<Attraction>().ToTable("Attractions");
        modelBuilder.Entity<AuditLog>().ToTable("Audit_Logs");
        modelBuilder.Entity<BookingDetail>().ToTable("Booking_Details");
        modelBuilder.Entity<Booking>().ToTable("Bookings");
        modelBuilder.Entity<Equipment>().ToTable("Equipments");
        modelBuilder.Entity<Invoice>().ToTable("Invoices");
        modelBuilder.Entity<LossAndDamage>().ToTable("Loss_And_Damages");
        modelBuilder.Entity<Membership>().ToTable("Memberships");
        modelBuilder.Entity<OrderServiceDetail>().ToTable("Order_Service_Details");
        modelBuilder.Entity<OrderService>().ToTable("Order_Services");
        modelBuilder.Entity<Notification>().ToTable("Notifications");
        modelBuilder.Entity<Payment>().ToTable("Payments");
        modelBuilder.Entity<Permission>().ToTable("Permissions");
        modelBuilder.Entity<Review>().ToTable("Reviews");
        modelBuilder.Entity<RolePermission>().ToTable("Role_Permissions");
        modelBuilder.Entity<Role>().ToTable("Roles");
        modelBuilder.Entity<RoomImage>().ToTable("Room_Images");
        modelBuilder.Entity<RoomInventory>().ToTable("Room_Inventory");
        modelBuilder.Entity<RoomType>().ToTable("Room_Types");
        modelBuilder.Entity<Room>().ToTable("Rooms");
        modelBuilder.Entity<RoomTypeAmenity>().ToTable("RoomType_Amenities");
        modelBuilder.Entity<ServiceCategory>().ToTable("Service_Categories");
        modelBuilder.Entity<Service>().ToTable("Services");
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<Voucher>().ToTable("Vouchers");
        modelBuilder.Entity<RefreshToken>().ToTable("Refresh_Tokens");

        // Column name mappings
        modelBuilder.Entity<Amenity>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.IconUrl).HasColumnName("icon_url");
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<ArticleCategory>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<Article>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.AuthorId).HasColumnName("author_id");
            e.Property(x => x.Title).HasColumnName("title");
            e.Property(x => x.Slug).HasColumnName("slug");
            e.Property(x => x.Content).HasColumnName("content");
            e.Property(x => x.ThumbnailUrl).HasColumnName("thumbnail_url");
            e.Property(x => x.PublishedAt).HasColumnName("published_at");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.HasIndex(x => x.Slug).IsUnique();
        });

        // Junction table: Article_Category_Map
        modelBuilder.Entity<ArticleCategoryMap>(e =>
        {
            // Composite PK prevents duplicate mappings
            e.HasKey(x => new { x.ArticleId, x.CategoryId });
            e.Property(x => x.ArticleId).HasColumnName("article_id");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            // Indexes for query performance
            e.HasIndex(x => x.ArticleId).HasDatabaseName("IX_Article_Category_Map_ArticleId");
            e.HasIndex(x => x.CategoryId).HasDatabaseName("IX_Article_Category_Map_CategoryId");
        });

        modelBuilder.Entity<Attraction>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.DistanceKm).HasColumnName("distance_km").HasColumnType("decimal(5,2)");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.MapEmbedLink).HasColumnName("map_embed_link");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.Longitude).HasColumnName("longitude");
            e.Property(x => x.Latitude).HasColumnName("latitude");

        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Action).HasColumnName("action");
            e.Property(x => x.TableName).HasColumnName("table_name");
            e.Property(x => x.RecordId).HasColumnName("record_id");
            e.Property(x => x.OldValue).HasColumnName("old_value");
            e.Property(x => x.NewValue).HasColumnName("new_value");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<BookingDetail>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.BookingId).HasColumnName("booking_id");
            e.Property(x => x.RoomId).HasColumnName("room_id");
            e.Property(x => x.RoomTypeId).HasColumnName("room_type_id");
            e.Property(x => x.CheckInDate).HasColumnName("check_in_date");
            e.Property(x => x.CheckOutDate).HasColumnName("check_out_date");
            e.Property(x => x.PricePerNight).HasColumnName("price_per_night").HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Booking>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.GuestName).HasColumnName("guest_name");
            e.Property(x => x.GuestPhone).HasColumnName("guest_phone");
            e.Property(x => x.GuestEmail).HasColumnName("guest_email");
            e.Property(x => x.BookingCode).HasColumnName("booking_code");
            e.Property(x => x.VoucherId).HasColumnName("voucher_id");
            e.Property(x => x.Status).HasColumnName("status");
            e.HasIndex(x => x.BookingCode).IsUnique();
        });

        modelBuilder.Entity<Equipment>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ItemCode).HasColumnName("item_code");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Category).HasColumnName("category");
            e.Property(x => x.Unit).HasColumnName("unit");
            e.Property(x => x.TotalQuantity).HasColumnName("total_quantity");
            e.Property(x => x.InUseQuantity).HasColumnName("in_use_quantity");
            e.Property(x => x.DamagedQuantity).HasColumnName("damaged_quantity");
            e.Property(x => x.LiquidatedQuantity).HasColumnName("liquidated_quantity");
            e.Property(x => x.BasePrice).HasColumnName("base_price").HasColumnType("decimal(18,2)");
            e.Property(x => x.DefaultPriceIfLost).HasColumnName("default_price_if_lost").HasColumnType("decimal(18,2)");
            e.Property(x => x.Supplier).HasColumnName("supplier");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.ImageUrl).HasColumnName("image_url");
            e.HasIndex(x => x.ItemCode).IsUnique();
        });

        modelBuilder.Entity<Invoice>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.BookingId).HasColumnName("booking_id");
            e.Property(x => x.TotalRoomAmount).HasColumnName("total_room_amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.TotalServiceAmount).HasColumnName("total_service_amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.DiscountAmount).HasColumnName("discount_amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.TaxAmount).HasColumnName("tax_amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.FinalTotal).HasColumnName("final_total").HasColumnType("decimal(18,2)");
            e.Property(x => x.Status).HasColumnName("status");
        });

        modelBuilder.Entity<LossAndDamage>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.BookingDetailId).HasColumnName("booking_detail_id");
            e.Property(x => x.RoomInventoryId).HasColumnName("room_inventory_id");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.PenaltyAmount).HasColumnName("penalty_amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.ImageUrl).HasColumnName("image_url");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Membership>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.TierName).HasColumnName("tier_name");
            e.Property(x => x.MinPoints).HasColumnName("min_points");
            e.Property(x => x.DiscountPercent).HasColumnName("discount_percent").HasColumnType("decimal(5,2)");
        });

        modelBuilder.Entity<OrderServiceDetail>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.OrderServiceId).HasColumnName("order_service_id");
            e.Property(x => x.ServiceId).HasColumnName("service_id");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.UnitPrice).HasColumnName("unit_price").HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<OrderService>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.BookingDetailId).HasColumnName("booking_detail_id");
            e.Property(x => x.OrderDate).HasColumnName("order_date");
            e.Property(x => x.TotalAmount).HasColumnName("total_amount").HasColumnType("decimal(18,2)");
            e.Property(x => x.Status).HasColumnName("status");
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Title).HasColumnName("title").HasColumnType("nvarchar(255)");
            e.Property(x => x.Content).HasColumnName("content").HasColumnType("nvarchar(max)");
            e.Property(x => x.Type).HasColumnName("type").HasColumnType("varchar(50)");
            e.Property(x => x.ReferenceLink).HasColumnName("reference_link").HasColumnType("varchar(255)");
            e.Property(x => x.IsRead).HasColumnName("is_read").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.InvoiceId).HasColumnName("invoice_id");
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method");
            e.Property(x => x.AmountPaid).HasColumnName("amount_paid").HasColumnType("decimal(18,2)");
            e.Property(x => x.TransactionCode).HasColumnName("transaction_code");
            e.Property(x => x.PaymentDate).HasColumnName("payment_date");
        });

        modelBuilder.Entity<Permission>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
        });

        modelBuilder.Entity<Review>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.RoomTypeId).HasColumnName("room_type_id");
            e.Property(x => x.Rating).HasColumnName("rating");
            e.Property(x => x.Comment).HasColumnName("comment");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Role>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Description).HasColumnName("description");
        });

        modelBuilder.Entity<RoomImage>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RoomTypeId).HasColumnName("room_type_id");
            e.Property(x => x.ImageUrl).HasColumnName("image_url");
            e.Property(x => x.IsPrimary).HasColumnName("is_primary");
        });

        modelBuilder.Entity<RoomInventory>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RoomId).HasColumnName("room_id");
            e.Property(x => x.EquipmentId).HasColumnName("equipment_id");
            e.Property(x => x.AmenityId).HasColumnName("amenity_id");
            e.Property(x => x.ItemName).HasColumnName("item_name");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.PriceIfLost).HasColumnName("price_if_lost").HasColumnType("decimal(18,2)");
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<RoomType>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.BasePrice).HasColumnName("base_price").HasColumnType("decimal(18,2)");
            e.Property(x => x.CapacityAdults).HasColumnName("capacity_adults");
            e.Property(x => x.CapacityChildren).HasColumnName("capacity_children");
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<Room>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RoomTypeId).HasColumnName("room_type_id");
            e.Property(x => x.RoomNumber).HasColumnName("room_number");
            e.Property(x => x.Floor).HasColumnName("floor");
            e.Property(x => x.Status).HasColumnName("status");
            e.Property(x => x.CleaningStatus).HasColumnName("cleaning_status");
        });

        modelBuilder.Entity<ServiceCategory>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
        });

        modelBuilder.Entity<Service>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.Price).HasColumnName("price").HasColumnType("decimal(18,2)");
            e.Property(x => x.Unit).HasColumnName("unit");
        });

        modelBuilder.Entity<User>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.RoleId).HasColumnName("role_id");
            e.Property(x => x.MembershipId).HasColumnName("membership_id");
            e.Property(x => x.FullName).HasColumnName("full_name");
            e.Property(x => x.Email).HasColumnName("email");
            e.Property(x => x.Phone).HasColumnName("phone");
            e.Property(x => x.PasswordHash).HasColumnName("password_hash");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.GoogleId).HasColumnName("google_id");
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url");
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Voucher>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Code).HasColumnName("code");
            e.Property(x => x.DiscountType).HasColumnName("discount_type");
            e.Property(x => x.DiscountValue).HasColumnName("discount_value").HasColumnType("decimal(18,2)");
            e.Property(x => x.MinBookingValue).HasColumnName("min_booking_value").HasColumnType("decimal(18,2)");
            e.Property(x => x.ValidFrom).HasColumnName("valid_from");
            e.Property(x => x.ValidTo).HasColumnName("valid_to");
            e.Property(x => x.UsageLimit).HasColumnName("usage_limit");
            e.Property(x => x.UsageCount).HasColumnName("usage_count");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<RolePermission>(e =>
        {
            e.Property(x => x.RoleId).HasColumnName("role_id");
            e.Property(x => x.PermissionId).HasColumnName("permission_id");
        });

        modelBuilder.Entity<RoomTypeAmenity>(e =>
        {
            e.Property(x => x.RoomTypeId).HasColumnName("room_type_id");
            e.Property(x => x.AmenityId).HasColumnName("amenity_id");
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Token).HasColumnName("token");
            e.Property(x => x.ExpiryDate).HasColumnName("expiry_date");
            e.Property(x => x.UserId).HasColumnName("user_id");
        });

        // Composite PKs
        modelBuilder.Entity<RolePermission>().HasKey(x => new { x.RoleId, x.PermissionId });

        modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.UserId);
            });

        modelBuilder.Entity<RoomTypeAmenity>().HasKey(x => new { x.RoomTypeId, x.AmenityId });

        // Relationships
        modelBuilder.Entity<RefreshToken>()
                .HasOne(e => e.User).WithMany(u => u.RefreshTokens).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Role).WithMany(r => r.Users).HasForeignKey(u => u.RoleId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Membership).WithMany(m => m.Users).HasForeignKey(u => u.MembershipId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Role).WithMany(r => r.RolePermissions).HasForeignKey(rp => rp.RoleId);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId);

        modelBuilder.Entity<Room>()
            .HasOne(r => r.RoomType).WithMany(rt => rt.Rooms).HasForeignKey(r => r.RoomTypeId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RoomTypeAmenity>()
            .HasOne(rta => rta.RoomType).WithMany(rt => rt.RoomTypeAmenities).HasForeignKey(rta => rta.RoomTypeId);

        modelBuilder.Entity<RoomTypeAmenity>()
            .HasOne(rta => rta.Amenity).WithMany(a => a.RoomTypeAmenities).HasForeignKey(rta => rta.AmenityId);

        modelBuilder.Entity<RoomImage>()
            .HasOne(ri => ri.RoomType).WithMany(rt => rt.RoomImages).HasForeignKey(ri => ri.RoomTypeId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RoomInventory>()
            .HasOne(ri => ri.Room).WithMany(r => r.RoomInventories).HasForeignKey(ri => ri.RoomId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RoomInventory>()
            .HasOne(ri => ri.Amenity).WithMany(a => a.RoomInventories).HasForeignKey(ri => ri.AmenityId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RoomInventory>()
            .HasOne(ri => ri.Equipment).WithMany(e => e.RoomInventories).HasForeignKey(ri => ri.EquipmentId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User).WithMany(u => u.Bookings).HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Voucher).WithMany(v => v.Bookings).HasForeignKey(b => b.VoucherId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BookingDetail>()
            .HasOne(bd => bd.Booking).WithMany(b => b.BookingDetails).HasForeignKey(bd => bd.BookingId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BookingDetail>()
            .HasOne(bd => bd.Room).WithMany(r => r.BookingDetails).HasForeignKey(bd => bd.RoomId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BookingDetail>()
            .HasOne(bd => bd.RoomType).WithMany(rt => rt.BookingDetails).HasForeignKey(bd => bd.RoomTypeId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Booking).WithMany(b => b.Invoices).HasForeignKey(i => i.BookingId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Invoice).WithMany(i => i.Payments).HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderService>()
            .HasOne(os => os.BookingDetail).WithMany(bd => bd.OrderServices).HasForeignKey(os => os.BookingDetailId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderServiceDetail>()
            .HasOne(osd => osd.OrderService).WithMany(os => os.OrderServiceDetails).HasForeignKey(osd => osd.OrderServiceId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderServiceDetail>()
            .HasOne(osd => osd.Service).WithMany(s => s.OrderServiceDetails).HasForeignKey(osd => osd.ServiceId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Service>()
            .HasOne(s => s.Category).WithMany(sc => sc.Services).HasForeignKey(s => s.CategoryId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User).WithMany(u => u.Reviews).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.RoomType).WithMany(rt => rt.Reviews).HasForeignKey(r => r.RoomTypeId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LossAndDamage>()
            .HasOne(l => l.BookingDetail).WithMany(bd => bd.LossAndDamages).HasForeignKey(l => l.BookingDetailId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LossAndDamage>()
            .HasOne(l => l.RoomInventory).WithMany(ri => ri.LossAndDamages).HasForeignKey(l => l.RoomInventoryId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AuditLog>()
            .HasOne(al => al.User).WithMany(u => u.AuditLogs).HasForeignKey(al => al.UserId).OnDelete(DeleteBehavior.SetNull);

        // Many-to-many: Article ↔ ArticleCategory via junction ArticleCategoryMap
        modelBuilder.Entity<ArticleCategoryMap>()
            .HasOne(m => m.Article)
            .WithMany(a => a.ArticleCategoryMaps)
            .HasForeignKey(m => m.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ArticleCategoryMap>()
            .HasOne(m => m.Category)
            .WithMany(ac => ac.ArticleCategoryMaps)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Article>()
            .HasOne(a => a.Author).WithMany(u => u.Articles).HasForeignKey(a => a.AuthorId).OnDelete(DeleteBehavior.SetNull);
    }
}

