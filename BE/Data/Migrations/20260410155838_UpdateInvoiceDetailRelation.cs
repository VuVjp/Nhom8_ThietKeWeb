using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInvoiceDetailRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<int>(
                name: "invoice_id",
                table: "Booking_Details",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Details_invoice_id",
                table: "Booking_Details",
                column: "invoice_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Booking_Details_Invoices_invoice_id",
                table: "Booking_Details",
                column: "invoice_id",
                principalTable: "Invoices",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Booking_Details_Invoices_invoice_id",
                table: "Booking_Details");

            migrationBuilder.DropIndex(
                name: "IX_Booking_Details_invoice_id",
                table: "Booking_Details");

            migrationBuilder.DropColumn(
                name: "invoice_id",
                table: "Booking_Details");

            migrationBuilder.AddColumn<int>(
                name: "booking_detail_id",
                table: "Invoices",
                type: "int",
                nullable: true);

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
    }
}
