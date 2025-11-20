-- V1__init.sql: Create base procurement tables
CREATE TABLE IF NOT EXISTS procurement_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rule_id VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  field_name VARCHAR(100),
  operator VARCHAR(50),
  rule_value VARCHAR(255),
  description TEXT,
  action VARCHAR(255),
  severity VARCHAR(50),
  automatable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pr_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pr_id VARCHAR(50) NOT NULL,
  po_id VARCHAR(50),
  requestor VARCHAR(100),
  dept VARCHAR(100),
  estimated_value_inr DECIMAL(18,2),
  currency VARCHAR(10),
  vendor_name VARCHAR(255),
  category VARCHAR(100),
  required_by_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
