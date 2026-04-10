using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class add_index_RoomDetals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Booking_Details_room_id",
                table: "Booking_Details");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Details_room_id_check_in_date_check_out_date",
                table: "Booking_Details",
                columns: new[] { "room_id", "check_in_date", "check_out_date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Booking_Details_room_id_check_in_date_check_out_date",
                table: "Booking_Details");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Details_room_id",
                table: "Booking_Details",
                column: "room_id");
        }
    }
}
