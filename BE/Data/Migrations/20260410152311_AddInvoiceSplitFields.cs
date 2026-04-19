using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceSplitFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "booking_detail_id",
                table: "Invoices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_type",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Consolidated");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_booking_detail_id",
                table: "Invoices",
                column: "booking_detail_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Booking_Details_booking_detail_id",
                table: "Invoices",
                column: "booking_detail_id",
                principalTable: "Booking_Details",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Booking_Details_booking_detail_id",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_booking_detail_id",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "booking_detail_id",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "invoice_type",
                table: "Bookings");
        }
    }
}
