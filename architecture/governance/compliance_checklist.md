# Compliance Checklist
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: Compliance Officer

---
## 1. Regulatory Scope
- CVC Procurement Guidelines
- Companies Act audit requirements
- IT Act 2000 (Digital Signatures + Data Protection)
- GST invoice retention rules
- Internal HPCL security policies

## 2. Data Retention
| Data Type | Retention | Storage | Disposal Method |
|-----------|-----------|---------|-----------------|
| PR / PO Records | 7 years | MySQL | Secure wipe after expiry |
| Invoices | 7 years | S3 (Object Lock) | Lifecycle transition + purge |
| Audit Logs | 7 years | MySQL + ES | Archive to cold storage |
| Attachments | 7 years | S3 | SHA-256 verify then purge |
| User Access Records | 5 years | MySQL | Encrypted export + wipe |

## 3. Security Controls
| Control | Status | Evidence |
|---------|--------|----------|
| RBAC enforcement | Implemented | Spring Security config |
| MFA for Admin | Implemented | Keycloak policy export |
| Encryption at Rest | Implemented | KMS key ARNs |
| TLS 1.3 | Implemented | Nginx config |
| Secrets in Vault | Implemented | Vault mounts / audit logs |
| Vulnerability Scans | Scheduled | CI pipeline reports |

## 4. Procurement Transparency
| Requirement | Implemented Mechanism |
|-------------|-----------------------|
| Tender publication | GeM/CPPP adapter + reconciliation |
| Approval traceability | Multi-level workflow + audit log |
| Rule application | Business rule engine (stored + versioned) |
| Exception handling | `exceptions` table + reports |

## 5. Digital Signatures (DSC)
| Aspect | Compliance |
|--------|-----------|
| Algorithm | PKCS#7 / SHA-256 |
| Legal Validity | IT Act 2000 Section 3 |
| Certificate Storage | Encrypted Vault secret |
| Tamper Detection | Hash chain + signature verification |

## 6. Personal Data Handling
| Item | Measure |
|------|---------|
| Email addresses | Stored encrypted (column-level) |
| Access logs | Limited to role-approved reviewers |
| Data export | Admin-only endpoint, logged |
| Right to correction | Editable by authorized roles |

## 7. Monitoring & Audit
| Metric | Threshold | Alert Path |
|--------|----------|------------|
| Failed logins | >50 / 5m | Security Officer |
| Privilege changes | Any | Compliance + Security |
| Data export events | Any | Compliance Officer |
| Rule modifications | Any | Business Owner review |

## 8. Change Management (Linked to policy)
| Change Type | Required Approval |
|-------------|-------------------|
| Critical (security, data model) | CAB + CISO |
| Major (workflow, integration) | CAB + Architect |
| Minor (UI, text) | Dev Lead |
| Emergency fix | Incident Manager + Retro review |

## 9. Reporting Cadence
| Report | Frequency | Audience |
|--------|-----------|----------|
| Audit Log Integrity | Monthly | Compliance + Audit |
| Vulnerability Summary | Weekly | Security Team |
| Procurement Activity | Monthly | Business Owner |
| Incident Summary | Quarterly | Exec Steering |

## 10. Outstanding Gaps
| Gap | Target Date | Owner |
|-----|-------------|-------|
| Automated column encryption for PII | 2026-02-15 | Security Officer |
| SOC2 external audit | 2026-06-30 | Compliance Officer |

## 11. Acceptance Criteria
- All mandatory controls marked Implemented
- Zero Critical vulnerabilities open >7 days
- Audit log completeness = 100% (sample verification)
- DSC verification success rate ≥99%

Approvals: Compliance Officer, Security Officer, Business Owner
Version History: v1.0 Initial
