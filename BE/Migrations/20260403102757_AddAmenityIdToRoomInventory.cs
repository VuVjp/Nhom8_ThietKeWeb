using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddAmenityIdToRoomInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "amenity_id",
                table: "Room_Inventory",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Room_Inventory_amenity_id",
                table: "Room_Inventory",
                column: "amenity_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Room_Inventory_Amenities_amenity_id",
                table: "Room_Inventory",
                column: "amenity_id",
                principalTable: "Amenities",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Room_Inventory_Amenities_amenity_id",
                table: "Room_Inventory");

            migrationBuilder.DropIndex(
                name: "IX_Room_Inventory_amenity_id",
                table: "Room_Inventory");

            migrationBuilder.DropColumn(
                name: "amenity_id",
                table: "Room_Inventory");
        }
    }
}
