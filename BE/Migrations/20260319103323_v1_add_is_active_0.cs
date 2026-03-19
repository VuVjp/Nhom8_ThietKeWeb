using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class v1_add_is_active_0 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GoogleId",
                table: "Users",
                newName: "google_id");

            migrationBuilder.RenameColumn(
                name: "IsLocked",
                table: "Users",
                newName: "is_active");

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "Room_Types",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "Room_Inventory",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "Attractions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "latitude",
                table: "Attractions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "longitude",
                table: "Attractions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "Articles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "Article_Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "Amenities",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_active",
                table: "Room_Types");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "Room_Inventory");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "Attractions");

            migrationBuilder.DropColumn(
                name: "latitude",
                table: "Attractions");

            migrationBuilder.DropColumn(
                name: "longitude",
                table: "Attractions");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "Article_Categories");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "Amenities");

            migrationBuilder.RenameColumn(
                name: "google_id",
                table: "Users",
                newName: "GoogleId");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "Users",
                newName: "IsLocked");
        }
    }
}
