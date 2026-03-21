# Nhom8_ThietKeWeb – Hệ thống Quản lý Khách sạn

Dự án **Nhóm 8 – Thiết Kế Web**: Xây dựng hệ thống quản lý khách sạn toàn diện với backend ASP.NET Core và frontend React + TypeScript.

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core 10.0 |
| ORM | Entity Framework Core (SQL Server) |
| Xác thực | JWT Bearer Token + Google OAuth |
| Frontend | React 19 + TypeScript + Vite |
| Tài liệu API | Swagger / OpenAPI |

---

## 📁 Cấu trúc dự án

```
Nhom8_ThietKeWeb/
├── BE/                  # Backend ASP.NET Core
│   ├── Auth/            # Xác thực & Phân quyền
│   ├── Controllers/     # 11 API Controllers
│   ├── Data/            # Database Context
│   ├── Dtos/            # Data Transfer Objects
│   ├── Entities/        # 27 Entity Models
│   ├── Migrations/      # EF Core Migrations
│   ├── Repositories/    # Tầng truy cập dữ liệu
│   ├── Services/        # Business Logic
│   └── Program.cs       # Cấu hình ứng dụng
└── FE/                  # Frontend React + TypeScript + Vite
    └── src/
```

---

## ✅ Các chức năng đã thực hiện

### 1. Xác thực & Phân quyền (`/api/auth`)

- **Đăng ký tài khoản** – Tạo tài khoản mới với email, họ tên, mật khẩu
- **Đăng nhập** – Đăng nhập bằng email/mật khẩu, trả về JWT + Refresh Token
- **Đăng nhập Google** – Xác thực qua Google OAuth (Google ID Token)
- **Làm mới token** – Cấp lại JWT từ Refresh Token còn hiệu lực
- **Đăng xuất** – Vô hiệu hóa Refresh Token
- **Phân quyền theo vai trò (RBAC)** – Kiểm soát truy cập dựa trên vai trò và 24 quyền hạn

### 2. Quản lý hồ sơ người dùng (`/api/userProfile`)

- **Xem hồ sơ** – Lấy thông tin cá nhân của tài khoản đang đăng nhập
- **Cập nhật hồ sơ** – Chỉnh sửa thông tin cá nhân
- **Đổi mật khẩu** – Đổi mật khẩu (kiểm tra mật khẩu cũ trước khi đổi)
- **Cập nhật avatar** – Upload/thay đổi ảnh đại diện

### 3. Quản lý người dùng – Admin (`/api/userManagement`)

- **Danh sách người dùng** – Xem tất cả tài khoản trong hệ thống
- **Tạo người dùng** – Tạo tài khoản mới và gán vai trò
- **Chỉnh sửa người dùng** – Cập nhật email, mật khẩu, thông tin
- **Đổi vai trò** – Thay đổi vai trò (Role) của người dùng
- **Xóa mềm người dùng** – Vô hiệu hóa tài khoản (không xóa vĩnh viễn)

### 4. Quản lý phòng (`/api/rooms`)

- **Danh sách phòng** – Lấy tất cả phòng khách sạn
- **Chi tiết phòng** – Xem thông tin chi tiết theo ID
- **Tạo phòng** – Thêm phòng mới (số phòng, tầng, loại phòng)
- **Cập nhật phòng** – Chỉnh sửa thông tin phòng
- **Đổi trạng thái phòng** – Cập nhật trạng thái: Trống / Đang sử dụng / Bảo trì
- **Đổi trạng thái vệ sinh** – Cập nhật: Sạch / Bẩn / Cần kiểm tra
- **Xóa phòng** – Xóa phòng khỏi hệ thống

### 5. Quản lý loại phòng (`/api/roomTypes`)

- **Danh sách loại phòng** – Lấy tất cả loại phòng kèm tiện nghi
- **Chi tiết loại phòng** – Xem thông tin theo ID
- **Tạo loại phòng** – Thêm loại phòng (tên, giá, sức chứa người lớn/trẻ em, mô tả)
- **Cập nhật loại phòng** – Chỉnh sửa thông tin
- **Xóa loại phòng** – Xóa loại phòng
- **Thêm ảnh loại phòng** – Thêm hình ảnh cho loại phòng
- **Xóa ảnh loại phòng** – Xóa hình ảnh
- **Đặt ảnh chính** – Chọn ảnh đại diện (primary image) cho loại phòng

### 6. Quản lý tiện nghi (`/api/amenities`)

- **Danh sách tiện nghi** – Lấy tất cả tiện nghi
- **Chi tiết tiện nghi** – Xem theo ID
- **Tạo tiện nghi** – Thêm tiện nghi mới (tên, URL icon)
- **Cập nhật tiện nghi** – Chỉnh sửa thông tin
- **Xóa tiện nghi** – Xóa tiện nghi khỏi hệ thống
- **Liên kết với loại phòng** – Gán tiện nghi cho loại phòng cụ thể

### 7. Quản lý kho thiết bị phòng (`/api/roomInventories`)

- **Danh sách kho** – Xem tất cả thiết bị/vật dụng trong kho
- **Kho của phòng cụ thể** – Xem danh sách theo phòng
- **Chi tiết mục kho** – Xem thông tin theo ID
- **Thêm thiết bị** – Tạo mục kho mới (tên, số lượng, giá thay thế)
- **Cập nhật thiết bị** – Chỉnh sửa thông tin mục kho
- **Xóa thiết bị** – Xóa mục khỏi kho
- **Sao chép kho** – Clone toàn bộ thiết bị từ phòng này sang phòng khác

### 8. Quản lý bài viết / Blog (`/api/articles`)

- **Danh sách bài viết** – Lấy tất cả bài viết
- **Chi tiết bài viết** – Xem theo ID
- **Tạo bài viết** – Thêm bài viết mới (tiêu đề, slug, nội dung, thumbnail, danh mục, tác giả)
- **Cập nhật bài viết** – Chỉnh sửa nội dung
- **Xóa bài viết** – Xóa bài viết
- **Cập nhật thumbnail** – Thay đổi ảnh đại diện bài viết

### 9. Quản lý danh mục bài viết (`/api/articleCategories`)

- **Danh sách danh mục** – Lấy tất cả danh mục
- **Chi tiết danh mục** – Xem theo ID
- **Tạo danh mục** – Thêm danh mục mới
- **Cập nhật danh mục** – Chỉnh sửa thông tin
- **Xóa danh mục** – Xóa danh mục

### 10. Quản lý địa điểm tham quan (`/api/attractions`)

- **Danh sách địa điểm** – Lấy tất cả địa điểm tham quan gần khách sạn
- **Chi tiết địa điểm** – Xem theo ID
- **Tạo địa điểm** – Thêm địa điểm mới (tên, khoảng cách, mô tả, link bản đồ, tọa độ)
- **Cập nhật địa điểm** – Chỉnh sửa thông tin
- **Xóa địa điểm** – Xóa địa điểm

### 11. Quản lý vai trò & quyền hạn (`/api/roles`)

- **Gán quyền cho vai trò** – Phân quyền cụ thể cho từng Role
- **Xem quyền hiện tại** – Lấy danh sách quyền của người dùng đang đăng nhập

---

## 🔐 Danh sách 24 quyền hạn trong hệ thống

| Nhóm | Quyền |
|---|---|
| Bài viết | `create_article`, `update_article`, `delete_article`, `update_thumbnail` |
| Danh mục bài viết | `create_article_category`, `update_article_category`, `delete_article_category` |
| Phòng | `get_all_rooms`, `create_room`, `update_room`, `delete_room` |
| Trạng thái phòng | `change_room_status`, `change_room_cleaning_status` |
| Loại phòng | `manage_room_type` |
| Kho thiết bị | `get_all_room_inventory`, `create_room_inventory`, `update_room_inventory`, `delete_room_inventory` |
| Tiện nghi | `create_amenity`, `update_amenity`, `delete_amenity` |
| Địa điểm tham quan | `manage_attraction` |
| Người dùng & Vai trò | `manage_user`, `manage_role`, `assign_role` |

---

## 🗃️ Cơ sở dữ liệu – 27 Entity Models

| Nhóm | Entities |
|---|---|
| Người dùng & Xác thực | `User`, `Role`, `Permission`, `RolePermission`, `RefreshToken` |
| Phòng & Loại phòng | `Room`, `RoomType`, `RoomImage`, `RoomTypeAmenity`, `Amenity` |
| Đặt phòng & Thanh toán | `Booking`, `BookingDetail`, `Invoice`, `Payment` |
| Dịch vụ | `Service`, `ServiceCategory`, `OrderService`, `OrderServiceDetail` |
| Trải nghiệm khách | `Review`, `Membership` |
| Kho & Bảo trì | `RoomInventory`, `LossAndDamage`, `AuditLog` |
| Nội dung | `Article`, `ArticleCategory` |
| Địa điểm | `Attraction` |

---

## 🚀 Hướng dẫn chạy dự án

### Backend

```bash
cd BE
dotnet restore
dotnet ef database update
dotnet run
```

API Swagger: `https://localhost:<port>/swagger`

### Frontend

```bash
cd FE
npm install
npm run dev
```

---

## 👥 Thành viên nhóm 8

Dự án môn Thiết Kế Web – Nhóm 8.
