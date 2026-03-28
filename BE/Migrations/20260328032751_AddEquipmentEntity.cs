using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "equipment_id",
                table: "Room_Inventory",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    item_code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    total_quantity = table.Column<int>(type: "int", nullable: false),
                    in_use_quantity = table.Column<int>(type: "int", nullable: false),
                    damaged_quantity = table.Column<int>(type: "int", nullable: false),
                    liquidated_quantity = table.Column<int>(type: "int", nullable: false),
                    base_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    default_price_if_lost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    supplier = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    image_url = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Room_Inventory_equipment_id",
                table: "Room_Inventory",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "IX_Equipments_item_code",
                table: "Equipments",
                column: "item_code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Room_Inventory_Equipments_equipment_id",
                table: "Room_Inventory",
                column: "equipment_id",
                principalTable: "Equipments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Room_Inventory_Equipments_equipment_id",
                table: "Room_Inventory");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropIndex(
                name: "IX_Room_Inventory_equipment_id",
                table: "Room_Inventory");

            migrationBuilder.DropColumn(
                name: "equipment_id",
                table: "Room_Inventory");
        }
    }
}
