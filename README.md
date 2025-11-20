# HPCL Procurement Automation System — Setup Complete ✅

## Project Structure Created

### Discovery Phase (2-4 weeks)
```
discovery/
├── README.md — Timeline, stakeholders, outputs
├── kickoff/
│   ├── kickoff-deck.md — 8-slide presentation
│   └── kickoff-agenda.txt — 90-minute meeting plan
├── rules/
│   ├── rules-catalog-template.csv — 6 CVC-style rules
│   └── approval-matrix.csv — 6 role-based thresholds
├── interviews/
│   ├── buyer-interview.txt — 14 questions
│   ├── approver-interview.txt — 12 questions
│   ├── it-interview.txt — 10 questions
│   └── legal-interview.txt — 10 questions
├── data/
│   ├── sample_pr_po.csv — 5 sample purchase requests
│   ├── data-field-mapping.csv — Logical to SAP field mapping
│   └── analyze_rules.py — Rule application automation script
├── design/
│   └── design-notes.md — HPCL theme, colors, CSS snippets
└── deliverables/
    ├── signoff-checklist.md — Required approvals
    └── risk-register.md — 8 discovery risks
```

### Backend (Spring Boot 3.2.2 + Java 17) ✅ BUILT
```
backend/
├── pom.xml — Maven build (MySQL, JPA, Flyway, Lombok)
├── src/main/
│   ├── java/com/hpcl/procurement/
│   │   ├── ProcurementApplication.java — Main class ✅
│   │   ├── controller/README.md
│   │   ├── service/README.md
│   │   ├── repository/README.md
│   │   ├── model/README.md
│   │   └── config/README.md
│   └── resources/
│       ├── application.yaml — MySQL config
│       └── db/migration/
│           └── V1__init.sql — Creates procurement_rules + pr_records
└── target/ — Built JAR ✅
```

### Frontend (React + Vite)
```
frontend/
├── package.json — React 18, React Router, Vite
├── vite.config.js — Proxy to backend:8080
├── index.html
└── src/
    ├── components/README.md
    ├── pages/README.md
    └── styles/hpcl-theme.css — HPCL colors + styles
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2.2, Java 17 |
| Database | MySQL 8.x |
| ORM | JPA/Hibernate |
| Migration | Flyway |
| Frontend | React 18 + Vite |
| Styling | HPCL-themed CSS (#003366, #E4002B, #FFB400) |

## Next Steps — Week 1

### 1. Schedule Interviews (Days 1-2)
Book 60-min sessions with:
- Procurement team (buyers, category managers)
- Finance (approvers, budget owners)
- Legal/Compliance
- IT/SAP team

Use interview guides in `discovery/interviews/`

### 2. Request SAP Data Exports (Day 2)
Ask IT for anonymized CSV exports:
- Last 50 PR/PO records
- Vendor master (top 100)
- Approval logs sample

### 3. Validate Rules with Legal (Days 3-4)
Review `discovery/rules/rules-catalog-template.csv`
- Confirm CVC/PSU compliance interpretations
- Add organization-specific rules
- Lock top 10 high-priority rules

### 4. Run Rule Analysis Demo (Day 5)
```bash
cd discovery/data
python analyze_rules.py
```
Share `rule_application_report.csv` with stakeholders

### 5. Setup Local Development Environment

#### Backend Setup
```bash
# Setup MySQL database
mysql -u root -p
CREATE DATABASE hpcl_procurement;
CREATE USER 'hpcl_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hpcl_procurement.* TO 'hpcl_user'@'localhost';

# Update backend/src/main/resources/application.yaml with your MySQL password

# Build and run
cd backend
mvn clean install
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:3000` with proxy to backend

## Design Theme — HPCL

### Color Palette
- **Primary Blue:** `#003366` (HPCL deep blue)
- **Accent Red:** `#E4002B` (HPCL red)
- **Golden:** `#FFB400`
- **Dark Navy:** `#001F3F` (text)
- **Neutral Light:** `#F8FAFB` (background)

### Typography
- **Font:** Poppins, Roboto
- **Base size:** 16px
- **Headings:** H1 28px, H2 22px, H3 18px

### Accessibility
- 4.5:1 contrast ratio for text
- Font-size controls in settings
- Keyboard navigation support
- Screen reader compatible

## Database Schema (V1 Migration)

### procurement_rules
- id, rule_id, category, field_name, operator, value
- description, action, severity, automatable
- created_at

### pr_records
- id, pr_id, po_id, requestor, dept
- estimated_value_inr, currency, vendor_name
- category, required_by_date, status
- created_at

## Discovery Phase Deliverables

By end of Week 3:
- ✅ Validated rules catalog
- ✅ Signed-off approval matrix
- ✅ Real SAP data samples
- ✅ Data field mappings confirmed
- ✅ Risk register with mitigations
- ✅ Sign-off from all stakeholders

## Ready for Step 2 — Sprint 0 Implementation

Once discovery sign-off complete:
1. Implement REST endpoints (PR CRUD, rule evaluation)
2. Build frontend pages (Dashboard, Approvals, Rules)
3. Connect frontend to backend APIs
4. Add authentication/authorization
5. Implement rule engine service
6. Add approval workflow orchestration

---

**Status:** ✅ Discovery artifacts complete, backend builds successfully, frontend ready for development

**Last Updated:** November 20, 2025
