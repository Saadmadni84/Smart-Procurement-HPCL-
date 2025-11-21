-- V2__extend_pr_records.sql: Add description & justification columns and default status
ALTER TABLE pr_records ADD COLUMN IF NOT EXISTS description VARCHAR(255);
ALTER TABLE pr_records ADD COLUMN IF NOT EXISTS justification TEXT;
-- Ensure status has a default value if NULL
UPDATE pr_records SET status = 'DRAFT' WHERE status IS NULL;