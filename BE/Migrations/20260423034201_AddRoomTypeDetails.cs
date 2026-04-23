using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomTypeDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BedType",
                table: "Room_Types",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SizeM2",
                table: "Room_Types",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "View",
                table: "Room_Types",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BedType",
                table: "Room_Types");

            migrationBuilder.DropColumn(
                name: "SizeM2",
                table: "Room_Types");

            migrationBuilder.DropColumn(
                name: "View",
                table: "Room_Types");
        }
    }
}
