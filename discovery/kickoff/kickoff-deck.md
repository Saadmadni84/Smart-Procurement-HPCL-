# Kickoff Deck — Discovery Phase

---

## Slide 1 — Purpose & Objectives
- Purpose: Align stakeholders and start discovery for Procurement Automation
- Objectives:
  - Capture current procurement process and decision points
  - Build rules catalog and approval matrix
  - Gather sample PR/PO data and map to SAP
  - Produce sign-off and risk register to move to implementation

---

## Slide 2 — Timeline
- Week 1: Kickoff, interviews, initial data exports
- Week 2: Rules cataloging, approval matrix, mapping
- Week 3: Validation, sign-off, handover

---

## Slide 3 — What Discovery Includes
- Process mapping and swimlane (buyers → approvers → finance)
- Rules catalog (CVC/PSU style policies)
- Approval matrix and delegation of authority
- Data field mapping and extracts from SAP
- Early technical constraints and integration considerations

---

## Slide 4 — Current Procurement Flow (Swimlane - textual)
- Buyer/Requestor: Create PR → Attach justification & vendor details
- Category Team: Review and consolidate PRs
- Approver(s): Stage-appropriate approvals (Tiered thresholds)
- Procurement/Contracting: Issue PO → Contract review if needed
- Finance: Budget check → Invoice match & payment

---

## Slide 5 — Key CVC/PSU Compliance Points
- Single-vendor justification requirements
- Tender thresholds and prior approval levels
- Vendor blacklisting and conflict-of-interest declarations
- Mandatory pre-bid disclosures and integrity clauses

---

## Slide 6 — Expected Outputs
- Rules catalog (CSV) with rules, severity, and automatable flag
- Approval matrix (CSV) mapping roles to thresholds
- Data mapping and sample PR/PO extracts
- Sign-off checklist and risk register

---

## Slide 7 — Integration & Technical Constraints
- SAP system access and data export formats (CSV, IDoc, API)
- Expected REST integration points (PR ingest, rule evaluation, approval actions)
- Security: SSO (SAML/OAUTH), encryption in transit, audit logs

---

## Slide 8 — Next Steps
- Schedule interviews and request data extracts
- Validate sample rules with Legal and Procurement
- Prepare initial database schema and API contract for Step 2
