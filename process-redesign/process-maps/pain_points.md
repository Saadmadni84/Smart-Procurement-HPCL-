# Discovery Pain Points

## Overview
This document consolidates the top 15 pain points identified during stakeholder interviews in the Discovery phase, mapped to proposed automation solutions.

---

## Pain Points Summary

| **ID** | **Pain Point** | **Stakeholder** | **Frequency** | **Impact** | **Proposed Solution** |
|--------|---------------|-----------------|---------------|-----------|----------------------|
| **PP-01** | **Email-based approvals get lost or delayed** | Buyers, Approvers | Daily | High | BPMN workflow with user tasks, mobile app notifications |
| **PP-02** | **No real-time visibility into PR status** | Buyers, Management | Daily | High | React dashboard with live BPMN process state |
| **PP-03** | **Manual SAP data entry causes typos, delays** | Buyers, Finance | Daily | Critical | Bidirectional SAP API integration (BAPI/OData) |
| **PP-04** | **Difficult to track CVC compliance rules** | Buyers, Legal | Weekly | Critical | Automated rule engine (Drools) with 100+ CVC rules |
| **PP-05** | **Budget check requires waiting for Finance team** | Buyers, Finance | Daily | High | Real-time SAP budget check via API (2-5 sec response) |
| **PP-06** | **Tender publication to 3 platforms is manual, time-consuming** | Buyers, Tender Committee | Weekly | High | Parallel publication via GeM, CPPP, email integration |
| **PP-07** | **Bid evaluation is subjective, inconsistent** | Tender Committee | Weekly | High | ML-based scoring + compliance engine + ranking |
| **PP-08** | **Exception handling has no defined escalation path** | All stakeholders | Weekly | Critical | Exception BPMN workflow with severity-based routing |
| **PP-09** | **Audit trail scattered across emails, Excel, SAP** | Legal, Audit | Monthly | Critical | Centralized immutable audit log with BPMN history |
| **PP-10** | **No automated classification of PRs by category** | Buyers | Daily | Medium | AI auto-classification based on description, vendor |
| **PP-11** | **Vendor queries handled via email, delayed responses** | Vendors, Buyers | Daily | Medium | Self-service vendor portal with automated responses |
| **PP-12** | **Invoice verification is manual, fraud-prone** | Finance, Audit | Daily | High | OCR + NLP for document extraction, auto-verification |
| **PP-13** | **No notification system for pending approvals** | Approvers | Daily | High | Email, SMS, mobile push notifications from BPMN |
| **PP-14** | **Duplicate data entry across systems (SAP, GeM, Excel)** | Buyers, Finance | Daily | High | Single source of truth with API integrations |
| **PP-15** | **Manual committee meetings for bid evaluation delays awards** | Tender Committee | Weekly | Medium | Asynchronous approval via web dashboard, quorum rules |

---

## Detailed Pain Point Analysis

### PP-01: Email-Based Approvals Get Lost or Delayed
**Stakeholder Quotes:**
- *"I receive 200+ emails daily. PR approvals get buried in my inbox."* — CFO
- *"I've had PRs stuck for 10 days because the approver was on leave and didn't set an email rule."* — Buyer

**Impact:**
- 30% of PRs delayed by >5 days due to missed emails
- No automatic escalation mechanism
- Approvers have no mobile access (tied to desktop Outlook)

**Current Workaround:**
- Buyers manually follow up via phone calls, WhatsApp
- Urgent PRs escalated to MD office via physical file

**Proposed Solution:**
- **BPMN User Tasks**: Assign approval tasks to `Manager`, `CFO`, `MD` candidate groups
- **Mobile App**: React Native app for iOS/Android with push notifications
- **Auto-Escalation**: Timer boundary event (48 hours) escalates to next level if no response
- **Delegation**: Approvers can delegate to alternate approver via web UI

**Expected Benefit:**
- 95% faster approver response time (24-48 hours → 2-4 hours)
- Zero lost approvals (tracked in BPMN database)
- Mobile approvals enable remote decision-making

---

### PP-02: No Real-Time Visibility Into PR Status
**Stakeholder Quotes:**
- *"Buyers call me 10 times a day asking 'Is my PR approved yet?'"* — Finance Manager
- *"I have no idea where my PR is stuck. Is it with Finance, Legal, or MD?"* — Buyer

**Impact:**
- 50+ status inquiry calls/emails per day
- No dashboards or reporting tools
- Management has no visibility into bottlenecks

**Current Workaround:**
- Buyers maintain personal Excel trackers
- Finance team manually exports SAP reports weekly

**Proposed Solution:**
- **React Dashboard**: Real-time PR status from BPMN engine
  - Pending Approvals (grouped by approver)
  - Active PRs (by status: Budget Check, Rule Validation, Approval, PO Generation)
  - Completed PRs (with cycle time metrics)
- **Process Analytics**: Heatmap showing bottlenecks (which user tasks take longest)
- **Role-Based Views**:
  - Buyer: "My PRs" with status timeline
  - Manager: "Pending on Me" + "Team's PRs"
  - Management: KPIs (avg cycle time, non-compliance rate, approval velocity)

**Expected Benefit:**
- Zero status inquiry calls (self-service dashboard)
- Management identifies bottlenecks in real-time
- Data-driven process optimization

---

### PP-03: Manual SAP Data Entry Causes Typos, Delays
**Stakeholder Quotes:**
- *"I spend 30-40% of my time entering PR data into SAP. One wrong vendor code and the PO bounces back."* — Buyer
- *"SAP rejects 20% of our POs due to incorrect cost center, material code, or currency fields."* — Finance

**Impact:**
- 60-90 minutes per PR for SAP data entry
- 20% error rate causing PO rejections, rework
- Triple data entry (Excel PR → Web form → SAP)

**Current Workaround:**
- Finance team manually validates SAP entries before PO creation
- Rework cycle adds 2-3 days to PR-to-PO timeline

**Proposed Solution:**
- **Spring Boot SAP Integration Services**:
  - `POST /api/sap/budget-check`: Check budget via BAPI_ACC_BUDGET_CHECK
  - `POST /api/sap/create-po`: Create PO via BAPI_PO_CREATE1
  - `GET /api/sap/vendor/{code}`: Validate vendor exists, fetch details
- **Auto-Population**: PR form fetches vendor name, GST, bank details from SAP
- **Idempotency**: Retry logic with unique `idempotency_key` to prevent duplicate POs
- **Error Handling**: SAP errors mapped to user-friendly messages ("Cost center 1001 is blocked for new commitments")

**Expected Benefit:**
- 99% faster SAP sync (60-90 min → 5-10 sec)
- Zero data entry errors (API-driven)
- Real-time budget validation (no waiting for Finance)

---

### PP-04: Difficult to Track CVC Compliance Rules
**Stakeholder Quotes:**
- *"The CVC manual is 500 pages. I can't remember all the rules for single vendor justification, proprietary purchases, emergency procurements."* — Buyer
- *"We've had 3 audit findings in the last year due to missed CVC rules (e.g., not taking MD approval for proprietary items >₹1L)."* — Legal

**Impact:**
- 15% non-compliance rate in audit reviews
- Manual rule lookup takes 20-40 minutes per PR
- Inconsistent interpretation of rules across buyers

**Current Workaround:**
- Buyers consult Legal team via email
- Legal maintains PDF rules catalog (not searchable)

**Proposed Solution:**
- **Drools Rule Engine**: 100+ CVC rules in decision tables
  - Example Rule: "IF category=Proprietary AND value>100000 THEN require MD approval + written justification"
  - Example Rule: "IF vendor is single-source AND value>50000 THEN attach CVC Form 17"
- **Rule Validation Service**: `POST /api/rules/evaluate`
  - Input: PR data (category, value, vendor, urgency)
  - Output: List of triggered rules, required actions, approval levels
- **Compliance Dashboard**: Shows active rules, recent violations, audit readiness score

**Expected Benefit:**
- 100% CVC compliance (automated rule enforcement)
- 98% faster rule validation (20-40 min → instant)
- Audit-ready reports with justification for every override

---

### PP-05: Budget Check Requires Waiting for Finance Team
**Stakeholder Quotes:**
- *"I submit a PR, then wait 4-24 hours for Finance to confirm if budget is available. Often they're in meetings or on leave."* — Buyer
- *"We manually log into SAP, check 3 different cost centers, email the buyer. It's inefficient."* — Finance

**Impact:**
- 4-24 hour delay per budget check
- Finance team handles 50+ budget check requests daily
- No mechanism to reserve budget during PR creation

**Current Workaround:**
- Urgent PRs escalated to CFO for manual override
- Buyers create PRs optimistically, rework if budget unavailable

**Proposed Solution:**
- **Real-Time SAP Budget Check**:
  - BPMN service task calls `POST /api/sap/budget-check`
  - SAP API response: `{budgetAvailable: true, remainingBudget: 500000, costCenter: "CC-1001"}`
  - Execution time: 2-5 seconds
- **Budget Reservation** (future enhancement): Lock budget upon PR creation, release if rejected
- **Conditional Routing**: If `budgetAvailable == false`, route to Finance Manager for reallocation

**Expected Benefit:**
- 99.9% faster budget validation (4-24 hours → 2-5 sec)
- Finance team freed up for value-added analysis
- No PR rejections due to budget unavailability

---

### PP-06: Tender Publication to 3 Platforms is Manual, Time-Consuming
**Stakeholder Quotes:**
- *"I have to upload the tender document to CPPP, then GeM, then copy-paste 200 vendor emails. It takes 2-4 hours."* — Buyer
- *"We miss GeM publication deadlines because the buyer forgot to upload there."* — Tender Committee

**Impact:**
- 2-4 hours per tender publication
- Missed platforms reduce bidder participation
- No audit trail of publication timestamps

**Current Workaround:**
- Buyers set Outlook reminders to upload to each platform
- Manual Excel log tracks publication dates

**Proposed Solution:**
- **Parallel Publication BPMN Workflow**:
  - Parallel gateway triggers 3 service tasks: `publish-cppp`, `publish-gem`, `email-vendors`
  - Each service calls REST API: `POST /api/cppp/publish`, `POST /api/gem/publish`, `POST /api/email/send-bulk`
- **Single Tender Entry**: Buyer creates tender once, system publishes everywhere
- **Publication Confirmation**: Email receipt from each platform logged in audit trail

**Expected Benefit:**
- 90% faster publication (2-4 hours → 10-15 min)
- 100% coverage of all required platforms
- Wider vendor participation (more bids, better prices)

---

### PP-07: Bid Evaluation is Subjective, Inconsistent
**Stakeholder Quotes:**
- *"Committee members score bids based on gut feeling. No objective criteria. Leads to vendor complaints."* — Tender Committee
- *"I've seen identical bids scored differently by different evaluators. It's embarrassing during audit reviews."* — Legal

**Impact:**
- 3-7 day bid evaluation cycle (manual scoring, meetings)
- Subjective scoring leads to vendor disputes, potential litigation
- No audit trail of scoring criteria

**Current Workaround:**
- Committee chair manually averages scores in Excel
- Legal reviews final scores for reasonableness

**Proposed Solution:**
- **ML-Based Bid Scoring**:
  - Feature engineering: Price (40%), delivery time (20%), past performance (20%), certifications (10%), quality (10%)
  - Python ML model trained on 500+ historical bids
  - Service task: `POST /api/ml/score-bid` returns `{mlScore: 0.87, priceRank: 2, qualityRank: 1}`
- **Compliance Checks**: Auto-verify GST, PAN, ISO certificates via OCR
- **Comparative Analysis**: Side-by-side price comparison, outlier detection
- **Human-in-Loop**: Committee reviews ML rankings, can override with justification

**Expected Benefit:**
- 95% faster evaluation (3-7 days → 4-8 hours)
- Objective, auditable scoring (ML weights documented)
- Fewer vendor disputes (transparent criteria)

---

### PP-08: Exception Handling Has No Defined Escalation Path
**Stakeholder Quotes:**
- *"When a PR violates a rule, we email Legal, they email Compliance, who escalates to MD. No one owns the exception."* — Buyer
- *"I've had PRs stuck in exception limbo for 10 days because no one knew who should approve the override."* — Finance

**Impact:**
- 3-10 day exception resolution time
- No severity-based routing (minor issues escalated to MD)
- Audit trail gaps (email-based escalations not logged)

**Current Workaround:**
- Buyers call stakeholders to expedite exceptions
- MD office maintains physical exception register

**Proposed Solution:**
- **Exception BPMN Workflow** (exception_handling.bpmn):
  - **Critical** (rule violation, budget breach) → Alert CVO → Freeze workflow → CVO committee review
  - **Major** (SAP sync failure, document missing) → Manager review → Escalate to MD if unresolved
  - **Minor** (timeout, notification failure) → Auto-retry → Buyer manual fix if retry fails
- **Service Tasks**: `classify-exception`, `freeze-workflow`, `log-override`, `resume-workflow`
- **Audit Trail**: Every exception logged with severity, approver, justification, timestamp

**Expected Benefit:**
- 90% faster resolution (3-10 days → 4-24 hours)
- Clear escalation path (no confusion on ownership)
- CVC-ready audit trail for all exceptions

---

### PP-09: Audit Trail Scattered Across Emails, Excel, SAP
**Stakeholder Quotes:**
- *"During CVC audits, we spend 5-10 hours per PR searching emails, Excel logs, SAP printouts to reconstruct the approval chain."* — Legal
- *"Email deletions cause audit trail gaps. We can't prove who approved what."* — Audit

**Impact:**
- 5-10 hours per audit request
- Incomplete audit trails (email deletions, Excel overwrites)
- CVC audit findings due to missing justifications

**Current Workaround:**
- Legal requests email exports from IT team
- Finance exports SAP approval logs (no justification notes)

**Proposed Solution:**
- **Centralized Audit Log**:
  - BPMN engine stores immutable history: every user task, service task, gateway decision
  - Audit table schema: `{prId, eventType, userId, timestamp, justification, systemState}`
- **Audit API**: `GET /api/audit/pr/{prId}` returns complete timeline with approver names, rule evaluations, SAP responses
- **Compliance Reports**: Pre-built reports for CVC (e.g., "All PRs >₹5L with MD approval + justification")

**Expected Benefit:**
- 99% faster audit report generation (5-10 hours → <5 min)
- 100% traceability (immutable log, no deletions)
- CVC audit readiness (automated compliance reports)

---

### PP-10: No Automated Classification of PRs by Category
**Stakeholder Quotes:**
- *"I have to manually select category from a dropdown (Services, Goods, Works, Consultancy). I often pick the wrong one."* — Buyer
- *"Wrong category assignment leads to wrong approval flow. IT services PRs routed to Works approver by mistake."* — Manager

**Impact:**
- 15-30 minutes per PR for manual categorization
- 10% miscategorization rate causing routing errors

**Current Workaround:**
- Buyers consult category guidelines PDF
- Manager manually corrects category during approval

**Proposed Solution:**
- **AI Auto-Classification Service**:
  - Input: PR description, vendor name, estimated value
  - ML model: TF-IDF + Random Forest trained on 5000+ historical PRs
  - Output: `{category: "IT Services", confidence: 0.92, suggestedVendor: "TCS"}`
- **Service Task**: `POST /api/classify-pr` called at start of BPMN workflow
- **Confidence Threshold**: If confidence <0.7, route to Buyer for manual verification

**Expected Benefit:**
- 95% faster classification (15-30 min → instant)
- 98% accuracy (ML model validated on test set)
- Correct approval routing (no category errors)

---

### PP-11: Vendor Queries Handled Via Email, Delayed Responses
**Stakeholder Quotes:**
- *"Vendors email questions about tender specs, payment terms. We respond in 24-48 hours. They complain about slow response."* — Buyer
- *"We have no FAQ system. Same questions asked by 20 vendors, answered 20 times."* — Tender Committee

**Impact:**
- 24-48 hour response time to vendor queries
- No self-service mechanism for common questions
- Vendor satisfaction score: 3.2/5

**Current Workaround:**
- Buyers copy-paste email responses
- Tender committee creates PDF FAQ manually

**Proposed Solution:**
- **Self-Service Vendor Portal**:
  - FAQ section with search (powered by NLP)
  - Live chat with AI bot for common queries (payment terms, delivery, specs)
  - Human escalation for complex queries
- **Automated Notifications**: Email/SMS when tender published, bid deadline approaching, evaluation complete
- **Vendor Dashboard**: Track submitted bids, view evaluation scores (post-award), download contracts

**Expected Benefit:**
- 80% query resolution via self-service (FAQ + AI bot)
- 90% faster response time (24-48 hours → 2-4 hours for escalated queries)
- Vendor satisfaction score: 4.5/5 (target)

---

### PP-12: Invoice Verification is Manual, Fraud-Prone
**Stakeholder Quotes:**
- *"I manually verify invoice amount, GST, PO number against SAP. Takes 1-3 hours per invoice. High risk of fraud."* — Finance
- *"We've had cases where vendors submit inflated invoices, fake GST numbers. Manual checks miss these."* — Audit

**Impact:**
- 1-3 hours per invoice verification
- Fraud risk (manual checks not foolproof)
- Payment delays (verification bottleneck)

**Current Workaround:**
- Finance team manually cross-checks 5-10 fields per invoice
- Random sample audits by Internal Audit team

**Proposed Solution:**
- **OCR + NLP Invoice Extraction**:
  - Azure Document Intelligence extracts invoice fields (amount, GST, vendor, PO number)
  - Service: `POST /api/ocr/extract-invoice` → `{amount: 50000, gst: "27AABCU9603R1Z5", poNumber: "PO-12345"}`
- **Auto-Verification**:
  - Match extracted fields against SAP PO
  - Call GST API to verify GST number validity
  - Flag mismatches for Finance review
- **Fraud Detection**: ML model flags suspicious patterns (outlier amounts, duplicate invoices)

**Expected Benefit:**
- 95% faster verification (1-3 hours → 5-10 min)
- Fraud detection (ML flags 95% of anomalies)
- Faster payments (vendor satisfaction improves)

---

### PP-13: No Notification System for Pending Approvals
**Stakeholder Quotes:**
- *"I only know about pending approvals when the buyer calls me. No proactive notifications."* — CFO
- *"I've missed urgent PRs because I didn't check my email for 2 days."* — Manager

**Impact:**
- 30% of approvals delayed due to lack of awareness
- No urgency indicator (emergency vs routine PR)
- No escalation reminders

**Current Workaround:**
- Buyers manually send reminder emails
- Urgent PRs escalated via phone/WhatsApp

**Proposed Solution:**
- **Multi-Channel Notifications**:
  - Email: "You have 3 pending PR approvals (1 urgent)"
  - SMS: "Urgent PR-12345 requires your approval (expires in 4 hours)"
  - Mobile push: In-app notification with deep link to approval screen
- **BPMN Integration**: Send notification on user task assignment, reminder every 24 hours, escalation notice after 48 hours
- **Customizable Preferences**: Approvers set notification channels, frequency, urgency thresholds

**Expected Benefit:**
- 95% faster approver response time (immediate awareness)
- Zero missed approvals (multi-channel redundancy)
- Better urgency management (priority flagging)

---

### PP-14: Duplicate Data Entry Across Systems (SAP, GeM, Excel)
**Stakeholder Quotes:**
- *"I enter the same PR data in Excel (for tracking), then web form (for approval), then SAP (for PO). Triple work."* — Buyer
- *"Data sync errors between systems cause PO rejections. Example: Vendor code in GeM differs from SAP."* — Finance

**Impact:**
- 3x data entry effort (60-90 min total per PR)
- Data inconsistency errors (20% error rate)
- No single source of truth

**Current Workaround:**
- Buyers maintain personal Excel files as backup
- Finance team manually reconciles SAP vs GeM data monthly

**Proposed Solution:**
- **Single Source of Truth**: React PR creation form → PostgreSQL database → Auto-sync to SAP, GeM
- **Bidirectional Sync**:
  - POST /api/sap/sync-pr: Push PR to SAP, receive SAP PR number
  - GET /api/gem/vendors: Fetch GeM vendor master, sync with local DB
- **Data Validation**: Pre-submission checks (vendor exists in SAP, budget code valid, GST format correct)
- **Conflict Resolution**: If SAP update fails, queue for manual review (no silent data loss)

**Expected Benefit:**
- Zero duplicate entry (single form, auto-sync)
- 99% data consistency (API-driven integration)
- Real-time visibility across systems

---

### PP-15: Manual Committee Meetings for Bid Evaluation Delays Awards
**Stakeholder Quotes:**
- *"We have to schedule committee meetings (8 members) for every bid evaluation. Finding a common slot takes 3-5 days."* — Tender Committee
- *"Committee members are senior managers with packed calendars. We can't meet for every ₹2L tender."* — CFO

**Impact:**
- 3-5 day delay waiting for committee quorum
- Overkill for low-value tenders (<₹5L)
- No asynchronous approval mechanism

**Current Workaround:**
- Urgent tenders approved via email circulation
- MD office convenes emergency meetings

**Proposed Solution:**
- **Asynchronous Approval via Web Dashboard**:
  - Committee members log in, view ML-ranked bids, add comments, vote (approve/reject)
  - Quorum rules: 5/8 members required for final decision
  - BPMN multi-instance user task: Parallel approval collection, aggregate votes
- **Threshold-Based Routing**:
  - <₹5L: Single approver (Department Head)
  - ₹5L-₹50L: 3-member sub-committee (asynchronous)
  - >₹50L: Full committee meeting (in-person or virtual)
- **Timer Events**: Auto-reminder after 24 hours, escalation to CFO after 48 hours

**Expected Benefit:**
- 90% faster decision-making (3-5 days → 6-12 hours for async approvals)
- No scheduling delays (asynchronous voting)
- Scalable to handle 3x tender volume

---

## Priority Ranking for Automation

| **Rank** | **Pain Point** | **Impact** | **Effort** | **ROI** |
|---------|---------------|-----------|-----------|---------|
| 1 | PP-03: Manual SAP data entry | Critical | Medium | Very High |
| 2 | PP-04: CVC compliance tracking | Critical | Medium | Very High |
| 3 | PP-05: Manual budget checks | High | Low | Very High |
| 4 | PP-01: Email-based approvals | High | Medium | High |
| 5 | PP-09: Scattered audit trail | Critical | Low | High |
| 6 | PP-07: Subjective bid evaluation | High | High | High |
| 7 | PP-08: No exception escalation | Critical | Medium | High |
| 8 | PP-06: Manual tender publication | High | Medium | Medium |
| 9 | PP-12: Manual invoice verification | High | Medium | Medium |
| 10 | PP-02: No real-time visibility | High | Low | Medium |

---

**Document Version**: 1.0  
**Last Updated**: May 2025  
**Owner**: HPCL Digital Transformation Team
