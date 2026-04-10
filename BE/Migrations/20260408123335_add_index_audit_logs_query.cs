using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class add_index_audit_logs_query : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "table_name",
                table: "Audit_Logs",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_created_at",
                table: "Audit_Logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_table_name_record_id",
                table: "Audit_Logs",
                columns: new[] { "table_name", "record_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Audit_Logs_created_at",
                table: "Audit_Logs");

            migrationBuilder.DropIndex(
                name: "IX_Audit_Logs_table_name_record_id",
                table: "Audit_Logs");

            migrationBuilder.AlterColumn<string>(
                name: "table_name",
                table: "Audit_Logs",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
