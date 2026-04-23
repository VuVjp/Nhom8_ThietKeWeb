USE HotelManagement;

-- Add new columns
ALTER TABLE [Audit_Logs] ADD [last_updated_at] DATETIME2 NULL;
ALTER TABLE [Audit_Logs] ADD [event_json] NVARCHAR(MAX) NULL;
ALTER TABLE [Audit_Logs] ADD [audit_date] DATE NULL;
GO

-- Backfill
UPDATE [Audit_Logs] SET
    audit_date = COALESCE(CONVERT(date, DATEADD(hour,7,created_at)), CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))),
    event_json = N'{"totalEvents":0,"events":[]}',
    last_updated_at = COALESCE(created_at, SYSUTCDATETIME());

UPDATE [Audit_Logs] SET event_json = N'{"totalEvents":0,"events":[]}' WHERE event_json IS NULL;
UPDATE [Audit_Logs] SET audit_date = CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME())) WHERE audit_date IS NULL;
UPDATE [Audit_Logs] SET last_updated_at = SYSUTCDATETIME() WHERE last_updated_at IS NULL;
GO

-- Make NOT NULL
ALTER TABLE [Audit_Logs] ALTER COLUMN [event_json] NVARCHAR(MAX) NOT NULL;
ALTER TABLE [Audit_Logs] ALTER COLUMN [audit_date] DATE NOT NULL;
GO

-- Drop old indexes
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Audit_Logs_table_name_record_id' AND object_id=OBJECT_ID('Audit_Logs'))
    DROP INDEX [IX_Audit_Logs_table_name_record_id] ON [Audit_Logs];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Audit_Logs_created_at' AND object_id=OBJECT_ID('Audit_Logs'))
    DROP INDEX [IX_Audit_Logs_created_at] ON [Audit_Logs];
GO

-- Drop old columns
ALTER TABLE [Audit_Logs] DROP COLUMN [action];
ALTER TABLE [Audit_Logs] DROP COLUMN [table_name];
ALTER TABLE [Audit_Logs] DROP COLUMN [record_id];
ALTER TABLE [Audit_Logs] DROP COLUMN [old_value];
ALTER TABLE [Audit_Logs] DROP COLUMN [new_value];
ALTER TABLE [Audit_Logs] DROP COLUMN [created_at];
GO

-- New indexes
CREATE UNIQUE INDEX [IX_Audit_Logs_audit_date_user_id] ON [Audit_Logs]([audit_date],[user_id]) WHERE [user_id] IS NOT NULL;
CREATE INDEX [IX_Audit_Logs_last_updated_at] ON [Audit_Logs]([last_updated_at]);
GO

-- Register migration
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId='20260419122616_NormalizeAuditLogColumns')
    INSERT INTO __EFMigrationsHistory (MigrationId,ProductVersion) VALUES ('20260419122616_NormalizeAuditLogColumns','9.0.0');

PRINT 'NormalizeAuditLogColumns: DONE';
GO
