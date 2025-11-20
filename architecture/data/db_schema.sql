-- HPCL Procurement Automation System
-- Database Schema (MySQL 8.0+)
-- Version: 1.0
-- Last Updated: 2025-11-21

-- ==================================================
-- DATABASE CONFIGURATION
-- ==================================================

CREATE DATABASE IF NOT EXISTS hpcl_procurement
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hpcl_procurement;

-- Enable strict mode
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ==================================================
-- USER MANAGEMENT & AUTHENTICATION
-- ==================================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(200) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO roles (role_name, description) VALUES
('REQUESTOR', 'Can create and submit PRs'),
('APPROVER_L1', 'Level 1 approver (up to 5L)'),
('APPROVER_L2', 'Level 2 approver (5L - 50L)'),
('ADMIN', 'System administrator'),
('AUDITOR', 'Read-only access for audit');

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(200),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================================================
-- SUPPLIER & CATEGORY MASTER
-- ==================================================

CREATE TABLE suppliers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vendor_code VARCHAR(50) NOT NULL UNIQUE,
    vendor_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    contact_person VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approval_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendor_code (vendor_code),
    INDEX idx_category (category),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB;

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT,
    approval_threshold_l1 DECIMAL(15,2) DEFAULT 500000.00,
    approval_threshold_l2 DECIMAL(15,2) DEFAULT 5000000.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO categories (category_code, category_name, approval_threshold_l1, approval_threshold_l2) VALUES
('CHEMICALS', 'Chemicals & Petrochemicals', 500000, 5000000),
('STATIONERY', 'Office Stationery', 100000, 1000000),
('IT_HARDWARE', 'IT Hardware', 300000, 3000000),
('MACHINERY', 'Machinery & Equipment', 1000000, 10000000),
('SERVICES', 'Services & Consulting', 500000, 5000000);

-- ==================================================
-- PURCHASE REQUEST (PR) TABLES
-- ==================================================

CREATE TABLE purchase_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_number VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    detailed_description TEXT,
    category VARCHAR(100) NOT NULL,
    estimated_budget DECIMAL(15,2) NOT NULL,
    required_date DATE NOT NULL,
    justification TEXT,
    department VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(200) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    workflow_instance_id VARCHAR(100),
    gem_tender_id VARCHAR(100),
    gem_status VARCHAR(50),
    cppp_reference_id VARCHAR(100),
    last_synced_at TIMESTAMP NULL,
    INDEX idx_pr_number (pr_number),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_workflow_instance (workflow_instance_id),
    CONSTRAINT chk_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL_L1', 'PENDING_APPROVAL_L2', 'APPROVED', 'REJECTED', 'EXCEPTION', 'PO_CREATED', 'CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE pr_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT NOT NULL,
    line_number INT NOT NULL,
    material_code VARCHAR(50),
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    estimated_unit_price DECIMAL(12,2),
    specification TEXT,
    delivery_location VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    UNIQUE KEY uk_pr_line (pr_id, line_number),
    INDEX idx_material_code (material_code)
) ENGINE=InnoDB;

-- ==================================================
-- APPROVAL WORKFLOW
-- ==================================================

CREATE TABLE approvals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT NOT NULL,
    approver_level INT NOT NULL,
    approver_email VARCHAR(200) NOT NULL,
    approver_name VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason VARCHAR(50),
    digital_signature_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    INDEX idx_pr_id (pr_id),
    INDEX idx_approver_email (approver_email),
    INDEX idx_status (status),
    CONSTRAINT chk_approval_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
) ENGINE=InnoDB;

-- ==================================================
-- PURCHASE ORDER (PO) TABLES
-- ==================================================

CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    pr_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    po_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    sap_po_number VARCHAR(50),
    sap_sync_status VARCHAR(50),
    sap_synced_at TIMESTAMP NULL,
    authorized_signatory VARCHAR(200),
    digital_signature_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (vendor_id) REFERENCES suppliers(id),
    INDEX idx_po_number (po_number),
    INDEX idx_pr_id (pr_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_sap_po_number (sap_po_number),
    INDEX idx_status (status),
    CONSTRAINT chk_po_status CHECK (status IN ('DRAFT', 'ISSUED', 'SAP_SYNCED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE po_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    po_id BIGINT NOT NULL,
    pr_item_id BIGINT NOT NULL,
    line_number INT NOT NULL,
    material_code VARCHAR(50),
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    delivery_date DATE,
    sap_line_number INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (pr_item_id) REFERENCES pr_items(id),
    UNIQUE KEY uk_po_line (po_id, line_number),
    INDEX idx_material_code (material_code)
) ENGINE=InnoDB;

-- ==================================================
-- GOODS RECEIPT & INVOICE
-- ==================================================

CREATE TABLE goods_receipt_notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    po_id BIGINT NOT NULL,
    receipt_date DATE NOT NULL,
    received_by VARCHAR(200) NOT NULL,
    remarks TEXT,
    sap_material_doc_number VARCHAR(50),
    sap_synced_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    INDEX idx_grn_number (grn_number),
    INDEX idx_po_id (po_id),
    INDEX idx_sap_material_doc (sap_material_doc_number)
) ENGINE=InnoDB;

CREATE TABLE grn_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grn_id BIGINT NOT NULL,
    po_item_id BIGINT NOT NULL,
    line_number INT NOT NULL,
    quantity_received DECIMAL(12,3) NOT NULL,
    quality_status VARCHAR(20) NOT NULL DEFAULT 'PENDING_INSPECTION',
    rejection_quantity DECIMAL(12,3) DEFAULT 0,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (po_item_id) REFERENCES po_items(id),
    UNIQUE KEY uk_grn_line (grn_id, line_number),
    CONSTRAINT chk_quality_status CHECK (quality_status IN ('PENDING_INSPECTION', 'ACCEPTED', 'REJECTED'))
) ENGINE=InnoDB;

CREATE TABLE invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_invoice_number VARCHAR(50),
    po_id BIGINT NOT NULL,
    grn_id BIGINT,
    invoice_date DATE NOT NULL,
    invoice_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_date DATE,
    sap_invoice_number VARCHAR(50),
    sap_synced_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_po_id (po_id),
    INDEX idx_payment_status (payment_status),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'PROCESSED', 'PAID', 'REJECTED'))
) ENGINE=InnoDB;

-- ==================================================
-- BUSINESS RULES & EXCEPTIONS
-- ==================================================

CREATE TABLE business_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_description TEXT,
    rule_condition TEXT NOT NULL,
    rule_action TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_priority (priority)
) ENGINE=InnoDB;

CREATE TABLE rule_evaluations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT NOT NULL,
    rule_id BIGINT NOT NULL,
    evaluation_result VARCHAR(20) NOT NULL,
    evaluation_message TEXT,
    evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (rule_id) REFERENCES business_rules(id),
    INDEX idx_pr_id (pr_id),
    INDEX idx_rule_id (rule_id),
    CONSTRAINT chk_evaluation_result CHECK (evaluation_result IN ('PASSED', 'FAILED', 'WARNING'))
) ENGINE=InnoDB;

CREATE TABLE exceptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT,
    po_id BIGINT,
    exception_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to VARCHAR(200),
    resolution_notes TEXT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    INDEX idx_pr_id (pr_id),
    INDEX idx_po_id (po_id),
    INDEX idx_status (status),
    INDEX idx_exception_type (exception_type),
    CONSTRAINT chk_exception_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
) ENGINE=InnoDB;

-- ==================================================
-- DOCUMENT MANAGEMENT
-- ==================================================

CREATE TABLE attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    previous_version_id BIGINT,
    uploaded_by VARCHAR(200) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (previous_version_id) REFERENCES attachments(id),
    INDEX idx_pr_id (pr_id),
    INDEX idx_document_type (document_type),
    INDEX idx_is_latest (is_latest),
    CONSTRAINT chk_document_type CHECK (document_type IN ('REQUISITION', 'TECHNICAL_SPEC', 'QUOTATION', 'OTHER'))
) ENGINE=InnoDB;

CREATE TABLE extracted_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachment_id BIGINT NOT NULL,
    extraction_type VARCHAR(50) NOT NULL,
    extracted_text TEXT,
    extracted_entities JSON,
    confidence_score DECIMAL(5,4),
    extracted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE,
    INDEX idx_attachment_id (attachment_id),
    INDEX idx_extraction_type (extraction_type)
) ENGINE=InnoDB;

CREATE TABLE signatures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT,
    po_id BIGINT,
    attachment_id BIGINT,
    signature_id VARCHAR(100) NOT NULL UNIQUE,
    signature_data TEXT NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    certificate_serial VARCHAR(100) NOT NULL,
    signer_name VARCHAR(200) NOT NULL,
    signer_email VARCHAR(200) NOT NULL,
    signature_reason VARCHAR(500) NOT NULL,
    signed_at TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    revocation_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REVOKED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (attachment_id) REFERENCES attachments(id),
    INDEX idx_pr_id (pr_id),
    INDEX idx_po_id (po_id),
    INDEX idx_document_hash (document_hash),
    CONSTRAINT chk_revocation_status CHECK (revocation_status IN ('NOT_REVOKED', 'REVOKED'))
) ENGINE=InnoDB;

-- ==================================================
-- AUDIT LOG (APPEND-ONLY)
-- ==================================================

CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    user_id VARCHAR(200) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- Prevent updates/deletes on audit_log
DELIMITER //
CREATE TRIGGER prevent_audit_log_update
BEFORE UPDATE ON audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit log is append-only. Updates not allowed.';
END//

CREATE TRIGGER prevent_audit_log_delete
BEFORE DELETE ON audit_log
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit log is append-only. Deletes not allowed.';
END//
DELIMITER ;

-- ==================================================
-- SECURITY INCIDENTS
-- ==================================================

CREATE TABLE security_incidents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    affected_resource VARCHAR(255),
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    INDEX idx_incident_type (incident_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    CONSTRAINT chk_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_incident_status CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'))
) ENGINE=InnoDB;

-- ==================================================
-- WORKFLOW & INTEGRATION
-- ==================================================

CREATE TABLE workflow_instances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workflow_instance_id VARCHAR(100) NOT NULL UNIQUE,
    pr_id BIGINT NOT NULL,
    workflow_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    INDEX idx_pr_id (pr_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE integration_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    integration_type VARCHAR(50) NOT NULL,
    request_id VARCHAR(100) NOT NULL,
    pr_id BIGINT,
    po_id BIGINT,
    endpoint VARCHAR(255),
    request_payload TEXT,
    response_payload TEXT,
    http_status INT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    duration_ms INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    INDEX idx_integration_type (integration_type),
    INDEX idx_pr_id (pr_id),
    INDEX idx_po_id (po_id),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient_email VARCHAR(200) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_status (status),
    INDEX idx_notification_type (notification_type),
    CONSTRAINT chk_notification_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
) ENGINE=InnoDB;

-- ==================================================
-- PERFORMANCE INDEXES
-- ==================================================

-- Composite index for common queries
CREATE INDEX idx_pr_status_created_at ON purchase_requests(status, created_at);
CREATE INDEX idx_po_vendor_status ON purchase_orders(vendor_id, status);
CREATE INDEX idx_approval_pr_status ON approvals(pr_id, status);

-- ==================================================
-- SAMPLE DATA (FOR DEVELOPMENT)
-- ==================================================

-- Insert sample user
INSERT INTO users (email, full_name, employee_id, department, designation, is_active) VALUES
('requestor@hpcl.com', 'Rajesh Kumar', 'EMP001', 'REFINERY_OPS', 'Senior Engineer', TRUE),
('approver.l1@hpcl.com', 'Sunita Sharma', 'EMP002', 'PROCUREMENT', 'Procurement Manager', TRUE),
('approver.l2@hpcl.com', 'Amit Verma', 'EMP003', 'FINANCE', 'Finance Head', TRUE),
('admin@hpcl.com', 'System Admin', 'EMP999', 'IT', 'IT Administrator', TRUE);

-- Assign roles
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- Requestor
(2, 2), -- Approver L1
(3, 3), -- Approver L2
(4, 4); -- Admin

-- ==================================================
-- DATABASE CONFIGURATION
-- ==================================================

-- Set MySQL timezone
SET GLOBAL time_zone = '+05:30'; -- IST

-- Enable query cache (if not already enabled)
-- SET GLOBAL query_cache_size = 67108864; -- 64MB

-- Enable slow query log for monitoring
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2; -- Log queries > 2 seconds

-- ==================================================
-- BACKUP & RETENTION
-- ==================================================

-- Daily full backup: mysqldump --all-databases > backup.sql
-- Incremental backup: Binary logs (binlog)
-- Retention: 7 years for audit_log, 3 years for operational tables

-- ==================================================
-- END OF SCHEMA
-- ==================================================
