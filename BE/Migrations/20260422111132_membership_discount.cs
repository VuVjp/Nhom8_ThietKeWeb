using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class membership_discount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "loyalty_points",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "applied_membership_id",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "applied_membership_tier_name",
                table: "Bookings",
                type: "nvarchar(100)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "membership_discount_amount_applied",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "membership_discount_percent_applied",
                table: "Bookings",
                type: "decimal(5,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "loyalty_points",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "applied_membership_id",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "applied_membership_tier_name",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "membership_discount_amount_applied",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "membership_discount_percent_applied",
                table: "Bookings");
        }
    }
}
