# Integration Test Plan
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: QA Lead

---
## 1. Scope
Validate end-to-end flows across API, DB, Workflow (Zeebe), SAP Adapter, GeM/CPPP integration, DMS/eSign, Kafka messaging.

## 2. Objectives
- Ensure core procurement lifecycle (PR → Approval → PO → GRN → Invoice) functions across services.
- Validate data consistency (DB, workflow state, audit log, documents).
- Verify integrations (SAP, GeM/CPPP, eSign) handle success & failure paths.
- Confirm idempotency & retry logic.

## 3. Environments
| Env | Purpose | Data Refresh |
|-----|---------|--------------|
| DEV | Developer verification | Ad-hoc |
| STAGING | Full integration suite | Daily 02:00 IST |

## 4. Preconditions
- Latest migrations applied (Flyway baseline OK)
- Test accounts provisioned (REQUESTOR, APPROVER_L1, APPROVER_L2, ADMIN)
- External sandbox credentials valid (SAP, GeM, eMudhra)
- Workflow models deployed (PR_APPROVAL, PO_CREATION)
- Kafka topics exist & retention configured

## 5. Test Categories
1. Core Functional Flows
2. Integration Adapters
3. Workflow Progression
4. Data Integrity & Audit
5. Error Handling / Retries
6. Security & Access Control

## 6. Test Data Strategy
- Use synthetic PRs (budget tiers: <5L, >5L, edge 4.99L, 5.00L)
- Document samples (PDF invoice, PO PDF, image attachments)
- Vendor codes mapped in SAP & GeM sandbox

## 7. High-Level Scenarios
| ID | Scenario | Expected Outcome |
|----|----------|------------------|
| INT-001 | Create PR basic | PR stored, status DRAFT |
| INT-002 | Submit PR (<5L) | Workflow L1 approval only |
| INT-003 | Submit PR (≥5L) | L1 then L2 approval required |
| INT-004 | Approve PR L1 | Status PENDING_L2 or APPROVED |
| INT-005 | Approve PR L2 | Status APPROVED, PO workflow triggered |
| INT-006 | PO creation SAP success | PO record persisted, audit logged |
| INT-007 | PO creation SAP transient fail | Retry 3x then success |
| INT-008 | PO creation SAP permanent fail | Exception logged + DLQ |
| INT-009 | GeM publish success | Publish log entry, reconciliation OK |
| INT-010 | GeM publish rate limit | Backoff applied, eventual success |
| INT-011 | eSign approval doc | Signature hash stored, verification pass |
| INT-012 | Audit trail completeness | All actions logged with user & timestamp |
| INT-013 | JWT role enforcement | Unauthorized action returns 403 |
| INT-014 | Idempotent PO call | Duplicate request ignored, single PO |
| INT-015 | Attachment upload + OCR | Extracted data saved |
| INT-016 | Rule engine rejection | PR status REJECTED_RULES + audit entry |
| INT-017 | Workflow boundary error path | Error task executed, incident record |

## 8. Detailed Example (INT-006 SAP Success)
Steps:
1. Create & approve PR (≥5L) → triggers PO_CREATION.
2. Mock SAP sandbox returns HTTP 200 with PO number.
3. Verify DB tables: `purchase_orders`, `audit_log`.
4. Check workflow instance ended.
5. Kafka event `po.created` present.

Validation:
- PO number non-null & matches SAP response.
- Audit entry contains action=PO_CREATED.
- No messages in DLQ.

## 9. Negative Paths
| ID | Negative Case | Expected Handling |
|----|---------------|------------------|
| NEG-001 | SAP 503 transient | Exponential backoff then success |
| NEG-002 | SAP 400 invalid data | Abort + exception record |
| NEG-003 | GeM token expired | Refresh token then retry |
| NEG-004 | eSign hash mismatch | Regenerate hash + retry once |
| NEG-005 | Workflow worker crash | Job retried, no data loss |
| NEG-006 | DB deadlock | Transaction retry (max 3) |
| NEG-007 | Large attachment >10MB | 413 error + no persistence |

## 10. Validation Tools
- API: Postman / Newman + MockMvc
- Workflow: Zeebe client queries
- DB: Direct MySQL queries via pod exec
- Kafka: Console consumer for events
- Logs: `kubectl logs` + centralized ELK queries

## 11. Automation Strategy
- CI Integration tests (Maven failsafe) tag @integration
- Docker Compose local stack (MySQL, Kafka, Zeebe, MinIO)
- Nightly staging run with full suite

## 12. Metrics & Exit Criteria
- Pass rate ≥98% critical scenarios
- No unresolved high severity defects
- Zero data integrity mismatches (counts, foreign keys)
- All negative paths produced expected controlled failures

## 13. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Flaky external sandbox | Use recorded stubs for retry validation |
| Long workflow duration | Shorten timers in test profiles |
| Concurrent race conditions | Stress test with 20 parallel PR creations |

## 14. Approvals
- QA Lead
- Solution Architect
- Business Owner

Version History: v1.0 Initial
