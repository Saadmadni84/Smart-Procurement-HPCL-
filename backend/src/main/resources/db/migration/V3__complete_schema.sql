-- V3__complete_schema.sql
-- Complete database schema for HPCL Procurement System Sprint 1

-- Add new columns to pr_records
ALTER TABLE pr_records ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE pr_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE pr_records ADD COLUMN IF NOT EXISTS workflow_instance_id VARCHAR(255);

-- Create pr_items table
CREATE TABLE IF NOT EXISTS pr_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pr_id BIGINT NOT NULL,
    item_description VARCHAR(500),
    quantity INT,
    unit_price DECIMAL(15,2),
    total_price DECIMAL(15,2),
    category VARCHAR(100),
    specification TEXT,
    FOREIGN KEY (pr_id) REFERENCES pr_records(id) ON DELETE CASCADE
);

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pr_id VARCHAR(50) NOT NULL,
    approver_id VARCHAR(100),
    approver_name VARCHAR(200),
    approval_level INT,
    status VARCHAR(20) DEFAULT 'PENDING',
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create exception_records table
CREATE TABLE IF NOT EXISTS exception_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exception_id VARCHAR(50) UNIQUE NOT NULL,
    pr_id VARCHAR(50),
    rule_id VARCHAR(50),
    exception_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    resolution TEXT,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    action VARCHAR(50),
    performed_by VARCHAR(100),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50)
);

-- Update procurement_rules table structure
ALTER TABLE procurement_rules ADD COLUMN IF NOT EXISTS rule_id VARCHAR(50) UNIQUE;
ALTER TABLE procurement_rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE procurement_rules ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE procurement_rules ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Insert sample procurement rules
MERGE INTO procurement_rules (rule_id, category, field_name, operator, rule_value, description, action, severity, automatable, created_by, active) 
KEY (rule_id)
VALUES 
('RULE-001', 'IT Hardware', 'estimatedValueInr', '>=', '1000000', 'IT purchases above 1 Cr require CFO approval', 'REQUIRE_APPROVAL', 'HIGH', false, 'SYSTEM', true),
('RULE-002', 'Services', 'estimatedValueInr', '>=', '5000000', 'Service contracts above 5 Cr require Board approval', 'REQUIRE_APPROVAL', 'CRITICAL', false, 'SYSTEM', true),
('RULE-003', 'ALL', 'requiredByDate', '<', 'CURRENT_DATE+7', 'Urgent requests (< 7 days) need justification', 'FLAG', 'MEDIUM', true, 'SYSTEM', true),
('RULE-004', 'Capital Equipment', 'estimatedValueInr', '>=', '10000000', 'Capital expenditure above 10 Cr requires detailed business case', 'REQUIRE_DOCUMENTATION', 'HIGH', false, 'SYSTEM', true);

-- Insert sample PR with items
MERGE INTO pr_records (pr_id, description, category, dept, estimated_value_inr, currency, status, justification, created_by) 
KEY (pr_id)
VALUES ('PR-2025-01-SAMPLE', 'Dell Laptops for Dev Team', 'IT Hardware', 'IT', 1500000.00, 'INR', 'PENDING_APPROVAL', 'Team expansion - 10 new developers joining', 'john.doe@hpcl.co.in');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pr_items_pr_id ON pr_items(pr_id);
CREATE INDEX IF NOT EXISTS idx_approvals_pr_id ON approvals(pr_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id, status);
CREATE INDEX IF NOT EXISTS idx_exceptions_pr_id ON exception_records(pr_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_records(status, severity);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed ON audit_logs(performed_by, performed_at);
CREATE INDEX IF NOT EXISTS idx_rules_category ON procurement_rules(category, active);
