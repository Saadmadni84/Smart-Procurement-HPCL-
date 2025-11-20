# Discovery Phase — HPCL Procurement Automation System

Purpose
-------
This discovery phase collects requirements, maps compliance rules, and prepares a technical foundation to implement the HPCL Procurement Automation System. The goal is to capture current state processes, stakeholders, data, and rules so the design and implementation (Sprint 0 / Step 2) can begin with low risk.

Timeline
--------
- Duration: 2–4 weeks (recommended baseline: 3 weeks)
- Week 1: Kickoff, stakeholder interviews, initial data collection
- Week 2: Rules cataloging, approval matrix, data mapping, sample extraction
- Week 3: Validation, risk register, sign-off and transition to implementation

Stakeholder participation
-------------------------
- Procurement (buyers, category managers): process walkthroughs and rules validation
- Approvers & senior management: approval thresholds and sign-off criteria
- IT/SAP team: data extracts, field mappings, integration constraints
- Legal & Compliance: review of CVC/PSU requirements and contract terms
- Finance: budget/PO controls and invoice matching rules

Acceptable outputs
------------------
- Rules Catalog (CSV) capturing CVC-style procurement rules
- Approval Matrix (CSV) with role-based thresholds
- Interview pack (questions and notes)
- Data samples (PR/PO extracts) and field mapping to SAP
- Sign-off checklist and risk register

Technical notes
---------------
- Backend: Spring Boot (Java 17+), JPA/Hibernate, MySQL 8.x, Flyway for migrations
- Frontend: React + Vite (enterprise dashboard for workflows)
- Integrations: Design to enable REST API gateways for SAP, GeM, CPPP, and third-party systems

Next steps after discovery
-------------------------
Compile validated rules and data samples, then scaffold the service endpoints and database models to implement rule evaluation and approval workflows.
