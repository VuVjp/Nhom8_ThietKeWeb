using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeAuditLogColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Audit_Logs_table_name_record_id",
                table: "Audit_Logs");

            migrationBuilder.DropIndex(
                name: "IX_Audit_Logs_created_at",
                table: "Audit_Logs");

            migrationBuilder.AddColumn<DateTime>(
                name: "last_updated_at",
                table: "Audit_Logs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "event_json",
                table: "Audit_Logs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "audit_date",
                table: "Audit_Logs",
                type: "date",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE Audit_Logs
SET
    audit_date = COALESCE(CONVERT(date, DATEADD(hour, 7, created_at)), CONVERT(date, DATEADD(hour, 7, SYSUTCDATETIME()))),
    event_json = CASE
        WHEN [action] = N'DAILY_USER_BUCKET' AND new_value IS NOT NULL THEN new_value
        ELSE N'{""totalEvents"":0,""events"":[]}'
    END,
    last_updated_at = COALESCE(created_at, SYSUTCDATETIME());

;WITH Deduplicate AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, audit_date
               ORDER BY last_updated_at DESC, id DESC
           ) AS rn
    FROM Audit_Logs
    WHERE user_id IS NOT NULL
)
DELETE FROM Audit_Logs
WHERE id IN (
    SELECT id FROM Deduplicate WHERE rn > 1
);

UPDATE Audit_Logs
SET event_json = N'{""totalEvents"":0,""events"":[]}'
WHERE event_json IS NULL;

UPDATE Audit_Logs
SET audit_date = CONVERT(date, DATEADD(hour, 7, SYSUTCDATETIME()))
WHERE audit_date IS NULL;

UPDATE Audit_Logs
SET last_updated_at = SYSUTCDATETIME()
WHERE last_updated_at IS NULL;
");

            migrationBuilder.AlterColumn<string>(
                name: "event_json",
                table: "Audit_Logs",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "audit_date",
                table: "Audit_Logs",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "action",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "table_name",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "record_id",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "old_value",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "new_value",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "Audit_Logs");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_audit_date_user_id",
                table: "Audit_Logs",
                columns: new[] { "audit_date", "user_id" },
                unique: true,
                filter: "[user_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_last_updated_at",
                table: "Audit_Logs",
                column: "last_updated_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Audit_Logs_last_updated_at",
                table: "Audit_Logs");

            migrationBuilder.DropIndex(
                name: "IX_Audit_Logs_audit_date_user_id",
                table: "Audit_Logs");

            migrationBuilder.AddColumn<string>(
                name: "action",
                table: "Audit_Logs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "Audit_Logs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "new_value",
                table: "Audit_Logs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "old_value",
                table: "Audit_Logs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "record_id",
                table: "Audit_Logs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "table_name",
                table: "Audit_Logs",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
UPDATE Audit_Logs
SET
    action = N'DAILY_USER_BUCKET',
    table_name = N'AuditLogEvent',
    record_id = 0,
    old_value = NULL,
    new_value = event_json,
    created_at = last_updated_at;
");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_created_at",
                table: "Audit_Logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_table_name_record_id",
                table: "Audit_Logs",
                columns: new[] { "table_name", "record_id" });

            migrationBuilder.DropColumn(
                name: "audit_date",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "event_json",
                table: "Audit_Logs");

            migrationBuilder.DropColumn(
                name: "last_updated_at",
                table: "Audit_Logs");
        }
    }
}
