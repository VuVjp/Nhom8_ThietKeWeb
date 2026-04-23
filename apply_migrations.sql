-- ============================================================
-- Apply all pending EF Core migrations to HotelManagement DB
-- Run order matches migration timestamps
-- ============================================================

USE HotelManagement;
GO

-- ── 1. 20260407184542_ArticleCategoryMappingRefactor ────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260407184542_ArticleCategoryMappingRefactor')
BEGIN
    -- Create junction table
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Article_Category_Map')
    BEGIN
        CREATE TABLE [Article_Category_Map] (
            [article_id]  INT NOT NULL,
            [category_id] INT NOT NULL,
            CONSTRAINT [PK_Article_Category_Map] PRIMARY KEY ([article_id], [category_id]),
            CONSTRAINT [FK_Article_Category_Map_Articles_article_id]
                FOREIGN KEY ([article_id]) REFERENCES [Articles]([id]) ON DELETE CASCADE,
            CONSTRAINT [FK_Article_Category_Map_Article_Categories_category_id]
                FOREIGN KEY ([category_id]) REFERENCES [Article_Categories]([id]) ON DELETE CASCADE
        );
        CREATE INDEX [IX_Article_Category_Map_ArticleId]  ON [Article_Category_Map]([article_id]);
        CREATE INDEX [IX_Article_Category_Map_CategoryId] ON [Article_Category_Map]([category_id]);
        PRINT '  Created Article_Category_Map table';
    END

    -- Migrate existing data
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Articles' AND COLUMN_NAME='category_id')
    BEGIN
        INSERT INTO [Article_Category_Map] (article_id, category_id)
        SELECT id, category_id FROM [Articles] WHERE category_id IS NOT NULL;

        -- Drop old FK, index, column
        IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Articles_Article_Categories_category_id')
            ALTER TABLE [Articles] DROP CONSTRAINT [FK_Articles_Article_Categories_category_id];
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Articles_category_id' AND object_id=OBJECT_ID('Articles'))
            DROP INDEX [IX_Articles_category_id] ON [Articles];
        ALTER TABLE [Articles] DROP COLUMN [category_id];
        PRINT '  Migrated Articles.category_id to junction table';
    END

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260407184542_ArticleCategoryMappingRefactor','9.0.0');
    PRINT 'Applied: ArticleCategoryMappingRefactor';
END
GO

-- ── 2. 20260408022408_add_prices_booking_1 ──────────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260408022408_add_prices_booking_1')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='discount')
        ALTER TABLE [Bookings] ADD [discount] DECIMAL(18,2) NULL;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='final_price')
        ALTER TABLE [Bookings] ADD [final_price] DECIMAL(18,2) NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='total_price')
        ALTER TABLE [Bookings] ADD [total_price] DECIMAL(18,2) NOT NULL DEFAULT 0;

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260408022408_add_prices_booking_1','9.0.0');
    PRINT 'Applied: add_prices_booking_1';
END
GO

-- ── 3. 20260408104651_add_index_RoomDetals ──────────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260408104651_add_index_RoomDetals')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Booking_Details_room_id' AND object_id=OBJECT_ID('Booking_Details'))
        DROP INDEX [IX_Booking_Details_room_id] ON [Booking_Details];
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Booking_Details_room_id_check_in_date_check_out_date' AND object_id=OBJECT_ID('Booking_Details'))
        CREATE INDEX [IX_Booking_Details_room_id_check_in_date_check_out_date] ON [Booking_Details]([room_id],[check_in_date],[check_out_date]);

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260408104651_add_index_RoomDetals','9.0.0');
    PRINT 'Applied: add_index_RoomDetals';
END
GO

-- ── 4. 20260408123335_add_index_audit_logs_query ────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260408123335_add_index_audit_logs_query')
BEGIN
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260408123335_add_index_audit_logs_query','9.0.0');
    PRINT 'Applied: add_index_audit_logs_query (skipped - handled by later migration)';
END
GO

-- ── 5. 20260408190139_AddServiceModuleDetails ───────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260408190139_AddServiceModuleDetails')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Services' AND COLUMN_NAME='is_active')
        ALTER TABLE [Services] ADD [is_active] BIT NOT NULL DEFAULT 1;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Service_Categories' AND COLUMN_NAME='is_active')
        ALTER TABLE [Service_Categories] ADD [is_active] BIT NOT NULL DEFAULT 1;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Order_Services' AND COLUMN_NAME='created_at')
        ALTER TABLE [Order_Services] ADD [created_at] DATETIME2 NOT NULL DEFAULT GETDATE();

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Order_Services' AND COLUMN_NAME='updated_at')
        ALTER TABLE [Order_Services] ADD [updated_at] DATETIME2 NULL;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Order_Service_Details' AND COLUMN_NAME='service_name')
        ALTER TABLE [Order_Service_Details] ADD [service_name] NVARCHAR(MAX) NOT NULL DEFAULT '';

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Order_Service_Details' AND COLUMN_NAME='unit')
        ALTER TABLE [Order_Service_Details] ADD [unit] NVARCHAR(MAX) NOT NULL DEFAULT '';

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260408190139_AddServiceModuleDetails','9.0.0');
    PRINT 'Applied: AddServiceModuleDetails';
END
GO

-- ── 6. 20260409233115_AddIsActiveToReview ──────────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260409233115_AddIsActiveToReview')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Reviews' AND COLUMN_NAME='IsActive')
        ALTER TABLE [Reviews] ADD [IsActive] BIT NOT NULL DEFAULT 0;

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260409233115_AddIsActiveToReview','9.0.0');
    PRINT 'Applied: AddIsActiveToReview';
END
GO

-- ── 7. 20260410121344_UpdateInvoiceAndBookingDetail ─────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260410121344_UpdateInvoiceAndBookingDetail')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='CompletedAt')
        ALTER TABLE [Invoices] ADD [CompletedAt] DATETIME2 NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='CreatedAt')
        ALTER TABLE [Invoices] ADD [CreatedAt] DATETIME2 NOT NULL DEFAULT '0001-01-01';
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='InvoiceCode')
        ALTER TABLE [Invoices] ADD [InvoiceCode] NVARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='TotalLossDamageAmount')
        ALTER TABLE [Invoices] ADD [TotalLossDamageAmount] DECIMAL(18,2) NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Booking_Details' AND COLUMN_NAME='ActualCheckOutDate')
        ALTER TABLE [Booking_Details] ADD [ActualCheckOutDate] DATETIME2 NULL;

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260410121344_UpdateInvoiceAndBookingDetail','9.0.0');
    PRINT 'Applied: UpdateInvoiceAndBookingDetail';
END
GO

-- ── 8. 20260410152311_AddInvoiceSplitFields ─────────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260410152311_AddInvoiceSplitFields')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='booking_detail_id')
        ALTER TABLE [Invoices] ADD [booking_detail_id] INT NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='invoice_type')
        ALTER TABLE [Bookings] ADD [invoice_type] NVARCHAR(MAX) NOT NULL DEFAULT 'Consolidated';
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Invoices_booking_detail_id' AND object_id=OBJECT_ID('Invoices'))
        CREATE INDEX [IX_Invoices_booking_detail_id] ON [Invoices]([booking_detail_id]);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Invoices_Booking_Details_booking_detail_id')
        ALTER TABLE [Invoices] ADD CONSTRAINT [FK_Invoices_Booking_Details_booking_detail_id]
            FOREIGN KEY ([booking_detail_id]) REFERENCES [Booking_Details]([id]) ON DELETE SET NULL;

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260410152311_AddInvoiceSplitFields','9.0.0');
    PRINT 'Applied: AddInvoiceSplitFields';
END
GO

-- ── 9. 20260410155838_UpdateInvoiceDetailRelation ───────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260410155838_UpdateInvoiceDetailRelation')
BEGIN
    -- Drop old FK and column on Invoices
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Invoices_Booking_Details_booking_detail_id')
        ALTER TABLE [Invoices] DROP CONSTRAINT [FK_Invoices_Booking_Details_booking_detail_id];
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Invoices_booking_detail_id' AND object_id=OBJECT_ID('Invoices'))
        DROP INDEX [IX_Invoices_booking_detail_id] ON [Invoices];
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Invoices' AND COLUMN_NAME='booking_detail_id')
        ALTER TABLE [Invoices] DROP COLUMN [booking_detail_id];

    -- Add invoice_id to Booking_Details
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Booking_Details' AND COLUMN_NAME='invoice_id')
        ALTER TABLE [Booking_Details] ADD [invoice_id] INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Booking_Details_invoice_id' AND object_id=OBJECT_ID('Booking_Details'))
        CREATE INDEX [IX_Booking_Details_invoice_id] ON [Booking_Details]([invoice_id]);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Booking_Details_Invoices_invoice_id')
        ALTER TABLE [Booking_Details] ADD CONSTRAINT [FK_Booking_Details_Invoices_invoice_id]
            FOREIGN KEY ([invoice_id]) REFERENCES [Invoices]([id]) ON DELETE SET NULL;

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260410155838_UpdateInvoiceDetailRelation','9.0.0');
    PRINT 'Applied: UpdateInvoiceDetailRelation';
END
GO

-- ── 10. 20260419034423_AddIsActiveToMembershipFixed ─────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260419034423_AddIsActiveToMembershipFixed')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Memberships' AND COLUMN_NAME='is_active')
        ALTER TABLE [Memberships] ADD [is_active] BIT NOT NULL DEFAULT 1;

    -- Equipments: make nullable
    -- (ALTER COLUMN nullable is safe for existing data)

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260419034423_AddIsActiveToMembershipFixed','9.0.0');
    PRINT 'Applied: AddIsActiveToMembershipFixed';
END
GO

-- ── 11. 20260419045824_FixPendingModelChanges ───────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260419045824_FixPendingModelChanges')
BEGIN
    -- is_active already added above, just register
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260419045824_FixPendingModelChanges','9.0.0');
    PRINT 'Applied: FixPendingModelChanges';
END
GO

-- ── 12. 20260419122616_NormalizeAuditLogColumns ─────────────
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260419122616_NormalizeAuditLogColumns')
BEGIN
    -- Drop old indexes if exist
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Audit_Logs_table_name_record_id' AND object_id=OBJECT_ID('Audit_Logs'))
        DROP INDEX [IX_Audit_Logs_table_name_record_id] ON [Audit_Logs];
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Audit_Logs_created_at' AND object_id=OBJECT_ID('Audit_Logs'))
        DROP INDEX [IX_Audit_Logs_created_at] ON [Audit_Logs];

    -- Add new columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='last_updated_at')
        ALTER TABLE [Audit_Logs] ADD [last_updated_at] DATETIME2 NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='event_json')
        ALTER TABLE [Audit_Logs] ADD [event_json] NVARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='audit_date')
        ALTER TABLE [Audit_Logs] ADD [audit_date] DATE NULL;

    -- Backfill data
    UPDATE [Audit_Logs] SET
        audit_date = COALESCE(CONVERT(date, DATEADD(hour,7,created_at)), CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))),
        event_json = CASE WHEN [action]=N'DAILY_USER_BUCKET' AND new_value IS NOT NULL THEN new_value ELSE N'{"totalEvents":0,"events":[]}' END,
        last_updated_at = COALESCE(created_at, SYSUTCDATETIME())
    WHERE [action] IS NOT NULL OR created_at IS NOT NULL;

    UPDATE [Audit_Logs] SET event_json = N'{"totalEvents":0,"events":[]}' WHERE event_json IS NULL;
    UPDATE [Audit_Logs] SET audit_date = CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME())) WHERE audit_date IS NULL;
    UPDATE [Audit_Logs] SET last_updated_at = SYSUTCDATETIME() WHERE last_updated_at IS NULL;

    -- Make NOT NULL
    ALTER TABLE [Audit_Logs] ALTER COLUMN [event_json] NVARCHAR(MAX) NOT NULL;
    ALTER TABLE [Audit_Logs] ALTER COLUMN [audit_date] DATE NOT NULL;

    -- Drop old columns
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='action')
        ALTER TABLE [Audit_Logs] DROP COLUMN [action];
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='table_name')
        ALTER TABLE [Audit_Logs] DROP COLUMN [table_name];
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='record_id')
        ALTER TABLE [Audit_Logs] DROP COLUMN [record_id];
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='old_value')
        ALTER TABLE [Audit_Logs] DROP COLUMN [old_value];
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='new_value')
        ALTER TABLE [Audit_Logs] DROP COLUMN [new_value];
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Audit_Logs' AND COLUMN_NAME='created_at')
        ALTER TABLE [Audit_Logs] DROP COLUMN [created_at];

    -- New indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Audit_Logs_audit_date_user_id' AND object_id=OBJECT_ID('Audit_Logs'))
        CREATE UNIQUE INDEX [IX_Audit_Logs_audit_date_user_id] ON [Audit_Logs]([audit_date],[user_id]) WHERE [user_id] IS NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Audit_Logs_last_updated_at' AND object_id=OBJECT_ID('Audit_Logs'))
        CREATE INDEX [IX_Audit_Logs_last_updated_at] ON [Audit_Logs]([last_updated_at]);

    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260419122616_NormalizeAuditLogColumns','9.0.0');
    PRINT 'Applied: NormalizeAuditLogColumns';
END
GO

PRINT '==============================';
PRINT 'All migrations applied!';
PRINT '==============================';
