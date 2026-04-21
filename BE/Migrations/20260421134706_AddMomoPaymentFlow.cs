using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddMomoPaymentFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "transaction_code",
                table: "Payments",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "booking_id",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "momo_order_id",
                table: "Payments",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payment_for_type",
                table: "Payments",
                type: "varchar(50)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "raw_ipn",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "request_id",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "Payments",
                type: "varchar(50)",
                nullable: true);

            migrationBuilder.Sql(@"
;WITH DuplicateTx AS (
    SELECT
        id,
        transaction_code,
        ROW_NUMBER() OVER (
            PARTITION BY transaction_code
            ORDER BY id DESC
        ) AS rn
    FROM Payments
    WHERE transaction_code IS NOT NULL
)
UPDATE p
SET transaction_code = NULL
FROM Payments p
INNER JOIN DuplicateTx d ON d.id = p.id
WHERE d.rn > 1;
");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_booking_id",
                table: "Payments",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_momo_order_id",
                table: "Payments",
                column: "momo_order_id",
                unique: true,
                filter: "[momo_order_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_transaction_code",
                table: "Payments",
                column: "transaction_code",
                unique: true,
                filter: "[transaction_code] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Bookings_booking_id",
                table: "Payments",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Bookings_booking_id",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_booking_id",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_momo_order_id",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_transaction_code",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "booking_id",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "momo_order_id",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "payment_for_type",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "raw_ipn",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "request_id",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "status",
                table: "Payments");

            migrationBuilder.AlterColumn<string>(
                name: "transaction_code",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);
        }
    }
}
