# Step 2: Process Redesign & BPMN Prototyping

## Purpose

Transform the discovery artifacts from Step 1 into **automated, executable workflows** that will power the HPCL Procurement Automation System. This phase bridges business requirements and technical implementation by creating:

- **BPMN-based workflow definitions** executable on Camunda 8/Zeebe or Flowable
- **Redesigned procurement processes** that eliminate manual bottlenecks
- **Service specifications** for workflow orchestration, rule engines, and integrations
- **UI/UX guidelines** aligned with HPCL branding
- **API contracts** for frontend-backend communication

## Role of BPMN in the System

BPMN (Business Process Model and Notation) serves as the **executable process blueprint**:

1. **Human-Readable**: Business stakeholders can validate workflows visually
2. **Machine-Executable**: BPMN engines (Camunda/Flowable) execute processes directly
3. **Version-Controlled**: Process changes are tracked and auditable
4. **Integration-Ready**: Service tasks call REST APIs, rule engines, SAP, GeM, CPPP
5. **Exception-Aware**: Error boundaries and escalation paths built-in

## Redesigned Procurement Principles

### 1. Automation-First
- **Auto-classification** of PRs by category, value, and urgency
- **Automated budget validation** via SAP integration
- **Rule engine** evaluates compliance before human approval
- **Intelligent routing** to appropriate approvers based on thresholds

### 2. Human-in-Loop for Exceptions
- High-value purchases (>₹1 Cr) require MD/CVC committee approval
- Missing documents trigger manual review tasks
- Vendor conflicts escalate to Legal/Compliance
- ML-flagged bids route to evaluation committee

### 3. Auditability & Traceability
- Every process instance logged in BPMN engine database
- All decisions (automated & manual) timestamped with user/system ID
- Immutable audit trail for CVC compliance
- Integration events (SAP, GeM, CPPP) captured with request/response logs

### 4. SAP/GeM/CPPP Integration-Ready
- **SAP**: Bi-directional sync for PR/PO via OData/BAPI
- **GeM (Government e-Marketplace)**: Automated tender publication and vendor communication
- **CPPP (Central Public Procurement Portal)**: Compliance document submission
- **Idempotency**: Retry logic with duplicate detection

## Deliverables

### Process Artifacts
- ✅ Current vs. Future state comparison
- ✅ Pain points analysis (15 identified issues)
- ✅ Redesigned end-to-end process documentation
- ✅ Exception handling matrix (12+ scenarios)

### BPMN Diagrams (Camunda/Flowable Compatible)
- ✅ `pr_to_po.bpmn` — PR creation to PO issuance
- ✅ `tender_flow.bpmn` — Tender creation to vendor communication
- ✅ `bid_evaluation.bpmn` — Bid collection to final award
- ✅ `exception_handling.bpmn` — Escalation and resolution workflows

### Service Specifications
- ✅ Workflow Service — Orchestration layer APIs
- ✅ Rule Engine — Compliance evaluation service
- ✅ Document Intelligence — OCR/NLP extraction pipeline
- ✅ SAP Integration — Data sync and error handling

### UI/UX Design
- ✅ Wireframes for 6 key screens (React-based)
- ✅ HPCL theme guidelines (colors, typography, accessibility)

### API Contract
- ✅ OpenAPI 3.0 specification (complete with schemas, examples, security)

## Tech Stack Alignment

| Layer | Technology |
|-------|-----------|
| **BPMN Engine** | Camunda 8 / Zeebe or Flowable |
| **Backend** | Spring Boot (Java 17+), layered architecture |
| **Database** | MySQL 8.x (JPA/Hibernate, Flyway) |
| **Workflow DB** | Camunda/Flowable embedded or external PostgreSQL |
| **Frontend** | React + Vite (HPCL-themed) |
| **Integration** | REST APIs, SAP OData/BAPI, GeM/CPPP connectors |

## Compliance Requirements Met

- ✅ **CVC/PSU Rules**: Reflected in approval thresholds and exception handling
- ✅ **Audit Trail**: Every BPMN instance persisted with full history
- ✅ **Human Oversight**: High-value and sensitive decisions require manual approval
- ✅ **Exception Routing**: Automated escalation to correct approval hierarchy

## Next Steps After Step 2

Once BPMN diagrams and service specs are validated:

1. **Week 3-4**: Implement workflow service and rule engine (Spring Boot)
2. **Week 5-6**: Build frontend screens (React) and integrate APIs
3. **Week 7**: SAP/GeM integration and end-to-end testing
4. **Week 8**: UAT with procurement team and compliance sign-off

---

**Status**: Step 2 artifacts complete and ready for stakeholder validation.

**Last Updated**: November 20, 2025
