# Change Control Policy
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: Release Manager

---
## 1. Purpose
Ensure controlled, auditable, and risk-mitigated changes to production systems (application code, infrastructure, workflows, integrations, rules).

## 2. Scope
Includes: API services, database schema, workflow BPMN, business rules, infrastructure (K8s/Terraform), security configurations, integrations (SAP/GeM/eSign). Excludes: Non-functional UI copy changes in development stage (tracked in sprint only).

## 3. Change Categories
| Category | Example | Lead Time | Approval |
|----------|---------|-----------|----------|
| Critical | Security patch, DB encryption change | 24h (expedited) | CISO + CAB |
| Major | New workflow, data model modification | 5 business days | CAB + Architect |
| Minor | Endpoint addition, non-breaking rule | 2 business days | Dev Lead |
| Emergency | Prod outage fix | Immediate | Incident Manager + Post-mortem |

## 4. Workflow
1. Raise change request (CR) ticket with:
   - Description, Impact, Risk, Rollback plan, Test evidence
2. Risk assessment (Low/Medium/High)
3. Approval per category
4. Schedule deployment window (avoid month-end freeze)
5. Pre-deploy validation (build, tests, security scan green)
6. Execute deployment (follow deploy_runbook)
7. Post-deploy verification + CR closure
8. Archive evidence (logs, screenshots, test reports)

## 5. Required Artifacts
| Artifact | Critical | Major | Minor | Emergency |
|----------|---------|-------|-------|----------|
| Test Report | Yes | Yes | Yes | Partial |
| Rollback Plan | Yes | Yes | Yes | Simplified |
| Security Impact | Yes | Yes | If applicable | Rapid |
| Dependency List | Yes | Yes | Optional | Optional |
| CAB Minutes | Yes | Yes | No | Post-review |

## 6. Freeze Periods
| Period | Restriction |
|--------|-------------|
| Financial year close (Mar 25–Apr 10) | Critical only |
| Quarterly audit weeks | Major requires audit pre-approval |
| Month-end last 2 days | No schema changes |

## 7. Rollback Principles
- Always maintain previous image tag & migration reversal script.
- DB destructive migrations require reversible scripts or snapshot.
- Workflow versioning: retain previous BPMN until new version stable.

## 8. Emergency Changes
Trigger: Production outage (P1) or security breach.
Process:
- Minimal documentation (impact + action)
- Direct implement & verify
- Within 24h: full retro report, risk mitigation tasks

## 9. Audit & Logging
| Item | Mechanism |
|------|-----------|
| Change execution | Audit log entry (event_type=CHANGE) |
| Rule modifications | Versioned record + diff stored |
| Workflow deployment | BPMN checksum tracked |
| Infra changes | Terraform plan & apply logs archived |

## 10. KPIs
| KPI | Target |
|-----|--------|
| Failed changes (rollback) | <3% |
| Emergency changes / quarter | ≤2 |
| Unauthorized changes | 0 |
| Lead time adherence | ≥95% |

## 11. Risk Matrix
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Schema change corrupts data | Low | High | Backup + validation script |
| Workflow deadlock | Medium | Medium | Staging dry-run + token simulation |
| Integration credential misconfig | Medium | High | Vault pre-validation job |
| Security regression | Low | High | Mandatory SAST/DAST gating |

## 12. Tooling Enforcement
- Git branching: feature/* → develop → main (PR required)
- Required PR checks: unit tests, integration tests, security scan, coverage threshold
- Protected branches: main, release/*
- Tagging: semantic versioning for deployable artifacts

## 13. Communication
| Stage | Audience | Channel |
|-------|----------|---------|
| Approval | CAB | Ticket + Meeting |
| Scheduled | Ops + Stakeholders | Email / Teams |
| Deployment Start | Stakeholders | Teams broadcast |
| Completion | Stakeholders | Change ticket update |
| Rollback | Exec + Stakeholders | Priority alert |

## 14. Non-Compliance Handling
- First occurrence: Warning + training
- Repeated: Access restriction
- Severe (intentional bypass): Escalation to CISO / HR

## 15. Review Cycle
- Quarterly policy review
- Annual overhaul (align with corporate standards)

## 16. Acceptance Criteria
- All high/new risk changes documented & approved
- Rollback path validated for schema/workflow changes
- No unauthorized production alterations in audit sample

Approvals: Release Manager, Compliance Officer, Solution Architect
Version History: v1.0 Initial
