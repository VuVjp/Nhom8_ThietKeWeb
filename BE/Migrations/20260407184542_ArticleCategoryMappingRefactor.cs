using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class ArticleCategoryMappingRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create the new junction table first
            migrationBuilder.CreateTable(
                name: "Article_Category_Map",
                columns: table => new
                {
                    article_id = table.Column<int>(type: "int", nullable: false),
                    category_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Article_Category_Map", x => new { x.article_id, x.category_id });
                    table.ForeignKey(
                        name: "FK_Article_Category_Map_Article_Categories_category_id",
                        column: x => x.category_id,
                        principalTable: "Article_Categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Article_Category_Map_Articles_article_id",
                        column: x => x.article_id,
                        principalTable: "Articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Article_Category_Map_ArticleId",
                table: "Article_Category_Map",
                column: "article_id");

            migrationBuilder.CreateIndex(
                name: "IX_Article_Category_Map_CategoryId",
                table: "Article_Category_Map",
                column: "category_id");

            // 2. Migrate existing data (safe — no data loss)
            migrationBuilder.Sql(@"
                INSERT INTO Article_Category_Map (article_id, category_id)
                SELECT id, category_id
                FROM   Articles
                WHERE  category_id IS NOT NULL
            ");

            // 3. Drop the old FK, index, and column
            migrationBuilder.DropForeignKey(
                name: "FK_Articles_Article_Categories_category_id",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "IX_Articles_category_id",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "category_id",
                table: "Articles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 1. Recreate the old column
            migrationBuilder.AddColumn<int>(
                name: "category_id",
                table: "Articles",
                type: "int",
                nullable: true);

            // 2. Migrate data back (keep the lowest category ID to satisfy 1-to-N)
            migrationBuilder.Sql(@"
                UPDATE A
                SET    A.category_id = M.category_id
                FROM   Articles A
                INNER JOIN (
                    SELECT article_id, MIN(category_id) AS category_id
                    FROM   Article_Category_Map
                    GROUP BY article_id
                ) M ON M.article_id = A.id
            ");

            // 3. Recreate the old FK and index
            migrationBuilder.CreateIndex(
                name: "IX_Articles_category_id",
                table: "Articles",
                column: "category_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Article_Categories_category_id",
                table: "Articles",
                column: "category_id",
                principalTable: "Article_Categories",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // 4. Drop the junction table
            migrationBuilder.DropTable(
                name: "Article_Category_Map");
        }
    }
}
