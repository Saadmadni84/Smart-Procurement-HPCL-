# Redesigned Procurement Process

## Overview
This document provides a detailed narrative description of the end-to-end automated procurement process for HPCL, based on the BPMN workflows designed in Step 2.

---

## Process Architecture

### Core Principles
1. **Automation-First**: Default to automated decisions, human intervention only for exceptions
2. **Human-in-Loop**: Critical decisions (>₹5L approvals, CVC overrides) require human approval
3. **Auditability**: Every decision logged with timestamp, user ID, justification
4. **Integration**: Single data entry, auto-sync to SAP, GeM, CPPP
5. **Compliance**: 100% CVC rule enforcement via automated rule engine

### Technology Stack
- **Workflow Engine**: Camunda 8 / Flowable (BPMN 2.0 compliant)
- **Backend**: Spring Boot 3.2 (Java 17)
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL (audit log) + MySQL (transactional data)
- **Integration**: SAP BAPI/OData, GeM REST API, CPPP REST API
- **ML/AI**: Python ML models for classification, scoring
- **OCR**: Azure Document Intelligence for invoice/bid extraction

---

## Workflow 1: Purchase Request to Purchase Order (PR to PO)

### Process Owner
**Department Buyer** (initiator), **Finance Manager** (budget validator), **Approvers** (Manager/CFO/MD based on value)

### Trigger Event
Buyer clicks "Create PR" in React web app

### Detailed Flow

#### Step 1: PR Creation (Web Form)
**Actor**: Buyer  
**System**: React Frontend

**Actions**:
1. Buyer logs into HPCL Procurement Portal (`https://procurement.hpcl.com`)
2. Navigates to "Create Purchase Request" form
3. Fills mandatory fields:
   - PR Description (e.g., "5 Dell Laptops for IT Department")
   - Estimated Value (₹250,000)
   - Currency (INR)
   - Vendor Name (Dell India)
   - Department (IT)
   - Required By Date (2025-06-15)
   - Justification ("Replace 5-year-old laptops, Windows 11 upgrade required")
4. Optional fields auto-populated:
   - Cost Center (fetched from SAP based on Department)
   - Vendor Code (fetched from SAP Vendor Master)
   - Category (pre-filled as "IT Hardware", can override)
5. Clicks "Submit PR"

**Outputs**:
- PR record saved to PostgreSQL database with status `DRAFT`
- Generates unique PR ID: `PR-2025-05-001`
- BPMN process instance started: `PR_to_PO_Process`

---

#### Step 2: Auto-Classification (Service Task)
**BPMN Node**: `Task_AutoClassify`  
**Service Topic**: `classify-pr`  
**System**: Python ML Service

**Actions**:
1. BPMN engine creates external task on `classify-pr` topic
2. Python worker polls topic, receives PR data:
   ```json
   {
     "prId": "PR-2025-05-001",
     "description": "5 Dell Laptops for IT Department",
     "vendor": "Dell India",
     "estimatedValue": 250000
   }
   ```
3. ML model (TF-IDF + Random Forest) classifies:
   - **Category**: IT Hardware (confidence: 0.94)
   - **Suggested Vendor**: Dell India (confidence: 0.89)
   - **Procurement Type**: Direct Purchase (not tender)
4. Worker completes task, returns classification to BPMN engine:
   ```json
   {
     "category": "IT Hardware",
     "confidence": 0.94,
     "procurementType": "Direct"
   }
   ```

**Outputs**:
- PR status updated to `CLASSIFIED`
- Classification data saved to audit log

**Edge Cases**:
- If confidence <0.7: Route to `ExceptionReview` user task for manual classification

---

#### Step 3: SAP Budget Check (Service Task)
**BPMN Node**: `Task_BudgetCheck`  
**Service Topic**: `sap-budget-check`  
**System**: Spring Boot SAP Integration Service

**Actions**:
1. BPMN engine creates external task on `sap-budget-check` topic
2. Spring Boot worker calls SAP BAPI:
   ```java
   SapBudgetCheckRequest request = new SapBudgetCheckRequest()
       .setPrId("PR-2025-05-001")
       .setCostCenter("CC-IT-1001")
       .setEstimatedValue(250000)
       .setFiscalYear("2025");
   
   SapBudgetCheckResponse response = sapService.checkBudget(request);
   ```
3. SAP API response:
   ```json
   {
     "budgetAvailable": true,
     "remainingBudget": 1500000,
     "costCenter": "CC-IT-1001",
     "fiscalYear": "2025",
     "budgetCode": "IT-CAPEX-2025"
   }
   ```
4. Worker completes task with response data

**Outputs**:
- Process variable `budgetAvailable = true` set in BPMN engine
- PR status updated to `BUDGET_VALIDATED`

**Edge Cases**:
- If `budgetAvailable == false`: Route to `Finance Manager` for budget reallocation approval
- If SAP API timeout (>5 sec): Retry 3 times, then route to `ExceptionReview`

---

#### Step 4: Budget Gateway (Exclusive Gateway)
**BPMN Node**: `Gateway_BudgetCheck`

**Condition Evaluation**:
- **Condition**: `${budgetAvailable == true}`
  - **True**: Continue to `Task_RuleEngine`
  - **False**: Route to `Task_ExceptionReview` (Budget Unavailable Exception)

**Outputs**:
- Flow decision logged in audit trail
- If false: Exception created with severity `MAJOR`

---

#### Step 5: Rule Engine Evaluation (Service Task)
**BPMN Node**: `Task_RuleEngine`  
**Service Topic**: `rule-evaluation`  
**System**: Drools Rule Engine Service

**Actions**:
1. BPMN engine creates external task on `rule-evaluation` topic
2. Drools worker loads PR data and fires rules:
   ```java
   KieSession kSession = kContainer.newKieSession();
   kSession.insert(prRecord);
   kSession.fireAllRules();
   ```
3. Sample rules evaluated:
   - **Rule CVC-01**: IF `value > 100000` THEN require written justification
   - **Rule CVC-02**: IF `category == 'Proprietary'` THEN require MD approval
   - **Rule CVC-03**: IF `singleVendor == true AND value > 50000` THEN attach CVC Form 17
   - **Rule IT-01**: IF `category == 'IT Hardware' AND value > 200000` THEN require IT Head approval
4. Rules triggered:
   ```json
   {
     "rulesTriggered": [
       {
         "ruleId": "CVC-01",
         "description": "Written justification required for value >₹1L",
         "action": "REQUIRE_JUSTIFICATION",
         "severity": "MEDIUM",
         "compliant": true
       },
       {
         "ruleId": "IT-01",
         "description": "IT Head approval required for IT Hardware >₹2L",
         "action": "ADD_APPROVER",
         "severity": "HIGH",
         "compliant": true
       }
     ],
     "overallCompliance": true,
     "requiredApprovers": ["IT_HEAD", "MANAGER"]
   }
   ```

**Outputs**:
- PR status updated to `RULE_VALIDATED`
- Required approvers list stored in process variable: `requiredApprovers = ["IT_HEAD", "MANAGER"]`
- Audit log entry with all triggered rules

**Edge Cases**:
- If `overallCompliance == false`: Route to `ExceptionReview` with severity `CRITICAL`
- If rule requires document attachment (e.g., CVC Form 17) and missing: Block PR, send notification to Buyer

---

#### Step 6: Approval Path Gateway (Exclusive Gateway)
**BPMN Node**: `Gateway_ApprovalPath`

**Condition Evaluation**:
Based on `estimatedValue`:
- **<₹50,000**: `${estimatedValue < 50000}` → Route to `Task_AutoApprove`
- **₹50,000 - ₹5,00,000**: `${estimatedValue >= 50000 && estimatedValue < 500000}` → Route to `Task_ManagerApproval`
- **>₹5,00,000**: `${estimatedValue >= 500000}` → Route to `Task_MDApproval`

**Outputs**:
- Flow decision logged in audit trail
- Email/SMS notification sent to assigned approver

**Example**: For PR value ₹250,000, routes to `Task_ManagerApproval`

---

#### Step 7: Manager Approval (User Task)
**BPMN Node**: `Task_ManagerApproval`  
**Candidate Group**: `department-managers`  
**Assigned User**: IT Manager (auto-assigned based on department)

**User Interface** (React Dashboard):
1. Manager receives notification: "PR-2025-05-001 requires your approval"
2. Logs into dashboard → "Pending Approvals" tab
3. Views PR details:
   - Description: 5 Dell Laptops for IT Department
   - Value: ₹250,000
   - Requestor: John Doe (Buyer)
   - Budget: Available (₹15L remaining in CC-IT-1001)
   - Rules Triggered: CVC-01 (justification provided), IT-01 (requires IT Head approval)
   - Justification: "Replace 5-year-old laptops, Windows 11 upgrade required"
4. Manager actions:
   - **Approve**: Adds optional comment ("Approved, align with IT refresh cycle"), clicks "Approve"
   - **Reject**: Adds rejection reason ("Defer to Q3, budget constraints"), clicks "Reject"
   - **Request Info**: Adds query ("Confirm Dell warranty terms"), assigns back to Buyer

**Actions** (If Approved):
1. Manager clicks "Approve"
2. User task completed with output variable: `managerApproval = APPROVED`
3. BPMN engine creates new user task: `Task_ITHeadApproval` (as per Rule IT-01)

**Outputs**:
- PR status updated to `MANAGER_APPROVED`
- Approval timestamp, approver ID, comment logged in audit trail
- Notification sent to IT Head: "PR-2025-05-001 escalated to you for final approval"

**Edge Cases**:
- If Manager doesn't respond in 48 hours: Timer boundary event triggers escalation to CFO
- If Manager rejects: End event `PR_REJECTED`, notification to Buyer with rejection reason

---

#### Step 8: IT Head Approval (User Task)
**BPMN Node**: `Task_ITHeadApproval`  
**Candidate Group**: `it-heads`  
**Assigned User**: IT Head

**Actions**:
1. IT Head reviews PR (same UI as Manager)
2. Verifies technical specs: Dell Latitude 5540, 16GB RAM, 512GB SSD, Windows 11 Pro
3. Clicks "Approve"

**Outputs**:
- PR status updated to `IT_HEAD_APPROVED`
- All approvals complete, flow proceeds to PO generation

---

#### Step 9: PO Generation (Service Task)
**BPMN Node**: `Task_GeneratePO`  
**Service Topic**: `generate-po`  
**System**: Spring Boot PO Generation Service

**Actions**:
1. BPMN engine creates external task on `generate-po` topic
2. Spring Boot worker generates PO document:
   ```java
   PurchaseOrder po = new PurchaseOrder()
       .setPoId("PO-2025-05-001")
       .setPrId("PR-2025-05-001")
       .setVendor("Dell India")
       .setVendorCode("VENDOR-DELL-001")
       .setPoDate(LocalDate.now())
       .setLineItems(List.of(
           new LineItem("Dell Latitude 5540", 5, 50000, 250000)
       ))
       .setTotalValue(250000)
       .setCurrency("INR")
       .setPaymentTerms("Net 30")
       .setDeliveryDate(LocalDate.parse("2025-06-15"));
   
   poRepository.save(po);
   ```
3. Generates PDF PO document with HPCL letterhead
4. Worker completes task with PO ID

**Outputs**:
- PO record saved to database
- PDF PO available at `/api/po/download/PO-2025-05-001.pdf`
- PR status updated to `PO_GENERATED`

---

#### Step 10: SAP Sync (Service Task)
**BPMN Node**: `Task_SAPSync`  
**Service Topic**: `sap-sync-po`  
**System**: Spring Boot SAP Integration Service

**Actions**:
1. BPMN engine creates external task on `sap-sync-po` topic
2. Spring Boot worker calls SAP BAPI to create PO:
   ```java
   SapPoCreateRequest request = new SapPoCreateRequest()
       .setPoId("PO-2025-05-001")
       .setVendorCode("VENDOR-DELL-001")
       .setCompanyCode("HPCL")
       .setCostCenter("CC-IT-1001")
       .setLineItems(lineItems)
       .setTotalValue(250000);
   
   SapPoCreateResponse response = sapService.createPo(request);
   ```
3. SAP response:
   ```json
   {
     "success": true,
     "sapPoNumber": "4500012345",
     "message": "PO created successfully in SAP",
     "timestamp": "2025-05-15T10:30:00Z"
   }
   ```
4. Worker completes task with SAP PO number

**Outputs**:
- SAP PO number `4500012345` stored in database
- PR status updated to `SAP_SYNCED`
- Bidirectional link: Local PO `PO-2025-05-001` ↔ SAP PO `4500012345`

**Edge Cases**:
- If SAP API fails: Retry 3 times with exponential backoff (2s, 4s, 8s)
- If retry exhausted: Create exception with severity `MAJOR`, route to Finance Manager
- Idempotency: Use `idempotency_key` to prevent duplicate PO creation on retry

---

#### Step 11: End Event (Success)
**BPMN Node**: `EndEvent_Success`

**Actions**:
1. BPMN process instance marked as `COMPLETED`
2. Final notification sent to:
   - **Buyer**: "Your PR-2025-05-001 has been approved. PO-2025-05-001 created and synced to SAP (SAP PO: 4500012345)"
   - **Vendor**: "PO-2025-05-001 issued. Please deliver by 2025-06-15" (email + vendor portal notification)
   - **Finance**: "New PO created: PO-2025-05-001 (₹250,000) for budget code IT-CAPEX-2025"
3. PR status updated to `COMPLETED`

**Outputs**:
- Complete audit trail available for CVC review
- Cycle time metric: `PR Created (10:00 AM) → PO Synced to SAP (10:30 AM)` = **30 minutes** (vs 5-10 days manual)

---

## Workflow 2: Tender Publication and Bid Collection

### Process Owner
**Tender Committee** (approver), **Buyer** (initiator)

### Trigger Event
Buyer clicks "Create Tender" for procurement value >₹5L (as per CVC threshold)

### Detailed Flow

#### Step 1: Tender Creation (Web Form)
**Actor**: Buyer  
**System**: React Frontend

**Actions**:
1. Buyer creates tender form with fields:
   - Tender Title: "Annual IT Hardware Procurement FY 2025-26"
   - Tender Type: Open Tender
   - Estimated Value: ₹50,00,000
   - Tender Document: Upload PDF (technical specs, terms, evaluation criteria)
   - Bid Deadline: 2025-06-30 (30 days from publication)
   - Pre-Bid Meeting: 2025-06-10
   - EMD (Earnest Money Deposit): ₹50,000
2. Clicks "Submit for Committee Approval"

**Outputs**:
- Tender record saved with status `DRAFT`
- Tender ID: `TENDER-2025-05-001`
- BPMN process instance started: `Tender_Publication_Process`

---

#### Step 2: Validate Tender (Service Task)
**BPMN Node**: `Task_ValidateTender`  
**Service Topic**: `validate-tender`

**Actions**:
1. Validates mandatory fields (title, value, deadline, document)
2. Checks CVC compliance:
   - Bid deadline ≥ 21 days (CVC minimum for open tenders)
   - EMD = 2-5% of estimated value (✓ 1% is acceptable per CVC)
   - Tender document includes evaluation criteria
3. Returns validation result:
   ```json
   {
     "valid": true,
     "errors": [],
     "warnings": ["EMD is 1%, consider increasing to 2% as per CVC best practice"]
   }
   ```

**Outputs**:
- Tender status updated to `VALIDATED`
- Validation warnings shown to Buyer (non-blocking)

---

#### Step 3: Tender Committee Approval (User Task)
**BPMN Node**: `Task_CommitteeApproval`  
**Candidate Group**: `tender-committee`  
**Quorum**: 5 out of 8 members

**Actions**:
1. Committee members receive notification
2. Review tender document, evaluation criteria, estimated value
3. Asynchronous voting via dashboard:
   - Member 1 (IT Head): Approve ("Specs align with IT roadmap")
   - Member 2 (Finance): Approve ("Budget available")
   - Member 3 (Legal): Approve ("CVC compliant")
   - Member 4 (Procurement Head): Approve
   - Member 5 (CFO): Approve
4. Quorum reached (5/8), task auto-completes

**Outputs**:
- Tender status updated to `COMMITTEE_APPROVED`
- Approval votes logged in audit trail

---

#### Step 4: Parallel Publication (Parallel Gateway)
**BPMN Node**: `Gateway_ParallelPublish`  
**Branches**: 3 parallel service tasks

**Branch 1: Publish to CPPP**
- Service Topic: `publish-cppp`
- Calls CPPP REST API: `POST /api/cppp/tenders`
- Response: CPPP Tender ID `CPPP-TN-2025-12345`

**Branch 2: Publish to GeM**
- Service Topic: `publish-gem`
- Calls GeM REST API: `POST /api/gem/tenders`
- Response: GeM Tender ID `GEM-TN-2025-67890`

**Branch 3: Email Vendors**
- Service Topic: `email-vendors`
- Fetches vendor list from database (category = "IT Hardware")
- Sends bulk email to 200 vendors with tender PDF attachment

**Outputs**:
- Tender status updated to `PUBLISHED`
- Publication timestamps logged for CPPP, GeM, Email
- Vendor portal updated with new tender listing

---

#### Step 5: Bid Deadline Timer (Timer Event)
**BPMN Node**: `TimerEvent_BidDeadline`  
**Duration**: 30 days (`P30D`)

**Actions**:
1. Timer waits for 30 days
2. Automated reminders sent:
   - Day 20: "10 days left to submit bids for TENDER-2025-05-001"
   - Day 28: "2 days left to submit bids"
3. Timer expires on 2025-06-30 00:00:00 IST

**Outputs**:
- Tender status updated to `BID_DEADLINE_REACHED`
- No new bids accepted after deadline

---

#### Step 6: Collect Bids (Service Task)
**BPMN Node**: `Task_CollectBids`  
**Service Topic**: `collect-bids`

**Actions**:
1. Fetches bids from all sources:
   - CPPP: `GET /api/cppp/tenders/CPPP-TN-2025-12345/bids` → 45 bids
   - GeM: `GET /api/gem/tenders/GEM-TN-2025-67890/bids` → 38 bids
   - Vendor Portal: 12 direct uploads
2. Consolidates 95 total bids into centralized database
3. Extracts basic info:
   ```json
   {
     "bidId": "BID-001",
     "vendorName": "Dell India",
     "totalPrice": 4500000,
     "deliveryTime": "60 days",
     "documents": ["Technical Bid.pdf", "Commercial Bid.pdf", "Compliance Docs.pdf"]
   }
   ```

**Outputs**:
- 95 bid records saved to database
- Tender status updated to `BIDS_COLLECTED`

---

#### Step 7: Call Bid Evaluation Subprocess (Call Activity)
**BPMN Node**: `CallActivity_BidEvaluation`  
**Called Process**: `Bid_Evaluation_Process`

**Actions**:
1. Starts new BPMN process instance: `Bid_Evaluation_Process`
2. Passes tender ID and bid list as input variables
3. Waits for subprocess to complete (see Workflow 3 below)

**Outputs**:
- Subprocess returns winning bid ID: `BID-023`
- Tender status updated to `CONTRACT_AWARDED`

---

#### Step 8: End Event (Tender Complete)
**BPMN Node**: `EndEvent_TenderComplete`

**Actions**:
1. Notification sent to winning vendor: "Congratulations! You have been awarded contract for TENDER-2025-05-001"
2. Notifications sent to unsuccessful bidders: "Thank you for your participation. Winner: Dell India (Bid Score: 0.92)"
3. Tender results published on vendor portal (transparency as per CVC)

**Outputs**:
- Cycle time: Tender Created (Day 0) → Contract Awarded (Day 35) = **5 weeks** (vs 8-12 weeks manual)

---

## Workflow 3: Bid Evaluation Process

### Trigger Event
Called from Tender workflow via `CallActivity_BidEvaluation`

### Detailed Flow

#### Step 1: OCR Document Extraction (Service Task)
**BPMN Node**: `Task_OCR_Extraction`  
**Service Topic**: `ocr-extraction`  
**System**: Azure Document Intelligence Service

**Actions**:
1. For each bid (95 bids):
   - Extract text from "Commercial Bid.pdf"
   - Extract fields: Total Price, Unit Price, GST, Delivery Time, Payment Terms
2. Sample extraction:
   ```json
   {
     "bidId": "BID-001",
     "extractedFields": {
       "totalPrice": 4500000,
       "unitPrice": 50000,
       "gstNumber": "27AABCU9603R1Z5",
       "deliveryTime": "60 days",
       "paymentTerms": "Net 30"
     },
     "confidence": 0.96
   }
   ```

**Outputs**:
- Extracted data saved to database
- Bids with OCR errors flagged for manual review

---

#### Step 2: Automated Compliance Check (Service Task)
**BPMN Node**: `Task_ComplianceCheck`  
**Service Topic**: `compliance-check`

**Actions**:
1. For each bid, verify:
   - GST number valid (call GST API)
   - PAN card attached
   - ISO 9001 certificate valid (check expiry date)
   - EMD paid (₹50,000 deposit confirmed)
   - Technical specs meet minimum requirements (RAM ≥ 16GB, SSD ≥ 512GB)
2. Compliance result:
   ```json
   {
     "bidId": "BID-001",
     "compliant": true,
     "checks": [
       {"checkType": "GST", "passed": true},
       {"checkType": "PAN", "passed": true},
       {"checkType": "ISO9001", "passed": true},
       {"checkType": "EMD", "passed": true},
       {"checkType": "TechnicalSpecs", "passed": true}
     ]
   }
   ```

**Outputs**:
- 12 bids flagged as non-compliant (missing documents, invalid GST)
- 83 bids marked as compliant

---

#### Step 3: Compliance Gateway (Exclusive Gateway)
**BPMN Node**: `Gateway_ComplianceResult`

**Condition Evaluation**:
- **Compliant**: `${compliant == true}` → Route to `Task_MLScoring`
- **Non-Compliant**: `${compliant == false}` → Route to `Task_ReviewNonCompliance`

**Outputs**:
- 83 bids proceed to ML scoring
- 12 bids routed to compliance team for review

---

#### Step 4: Review Non-Compliant Bids (User Task)
**BPMN Node**: `Task_ReviewNonCompliance`  
**Candidate Group**: `compliance-team`

**Actions**:
1. Compliance officer reviews 12 flagged bids
2. For each bid, decision:
   - **Disqualify**: Bid missing critical document (e.g., no PAN card)
   - **Allow with Warning**: Minor issue (e.g., ISO certificate expires in 2 months, vendor commits to renewal)
3. Sample decision:
   - BID-045: Disqualify (no EMD payment)
   - BID-067: Allow with warning (ISO cert expires in 45 days, vendor provided renewal application proof)

**Outputs**:
- 8 bids disqualified, notified to vendors
- 4 bids allowed with warnings, proceed to ML scoring

---

#### Step 5: ML-Based Bid Scoring (Service Task)
**BPMN Node**: `Task_MLScoring`  
**Service Topic**: `ml-scoring`  
**System**: Python ML Service

**Actions**:
1. For each compliant bid (83 + 4 = 87 bids):
   - Features: Price (40%), Delivery Time (20%), Past Performance (20%), Quality Score (10%), Certifications (10%)
   - ML model (Gradient Boosting) trained on 500 historical bids
2. Sample scoring:
   ```json
   {
     "bidId": "BID-023",
     "vendor": "Dell India",
     "features": {
       "price": 4200000,
       "priceNormalized": 0.85,
       "deliveryTime": 45,
       "deliveryScore": 0.92,
       "pastPerformance": 0.88,
       "qualityScore": 0.90,
       "certifications": 1.0
     },
     "mlScore": 0.89,
     "priceRank": 3,
     "qualityRank": 1
   }
   ```

**Outputs**:
- All 87 bids scored, ranked by ML score
- Top 10 bids identified for final committee review

---

#### Step 6: Comparative Price Analysis (Service Task)
**BPMN Node**: `Task_PriceAnalysis`  
**Service Topic**: `price-analysis`

**Actions**:
1. Statistical analysis:
   - Mean bid price: ₹4,350,000
   - Median bid price: ₹4,280,000
   - Std deviation: ₹320,000
   - Outlier detection: Bids >2 std dev from mean flagged
2. Outliers:
   - BID-089: ₹6,200,000 (42% above mean, flagged as unusually high)
   - BID-012: ₹2,800,000 (36% below mean, flagged as suspiciously low, possible predatory pricing)

**Outputs**:
- Price analysis report generated
- Outliers flagged for committee discussion

---

#### Step 7: Rank Bids by Score (Service Task)
**BPMN Node**: `Task_RankBids`  
**Service Topic**: `rank-bids`

**Actions**:
1. Sort 87 bids by ML score (descending)
2. Top 10 bids:
   1. BID-023 (Dell India): 0.89
   2. BID-056 (HP India): 0.87
   3. BID-034 (Lenovo India): 0.85
   4. BID-071 (Acer India): 0.83
   5. BID-019 (ASUS India): 0.81
   ...

**Outputs**:
- Ranked list saved to database
- Top 10 shortlisted for committee review

---

#### Step 8: Quality Threshold Gateway (Exclusive Gateway)
**BPMN Node**: `Gateway_QualityThreshold`

**Condition Evaluation**:
- **High Quality**: `${mlScore >= 0.7}` → Route directly to `Task_CommitteeApproval`
- **Low Quality**: `${mlScore < 0.7}` → Route to `Task_ManualReview` (expert evaluation required)

**Outputs**:
- Top 10 bids (score ≥0.81) proceed to committee approval
- 5 borderline bids (score 0.65-0.69) routed to manual expert review

---

#### Step 9: Committee Final Approval (User Task)
**BPMN Node**: `Task_CommitteeApproval`  
**Candidate Group**: `eval-committee`

**Actions**:
1. Committee reviews top 10 bids asynchronously
2. Dashboard shows:
   - Bid comparison table (price, delivery time, past performance, ML score)
   - Price analysis chart (mean, median, outliers)
   - Compliance status for each bid
3. Committee discussion points:
   - BID-023 (Dell) has highest ML score (0.89) but 3rd in price
   - BID-034 (Lenovo) is cheapest (₹4,050,000) but lower quality score (0.85)
   - BID-012 (Unknown Vendor) flagged as suspiciously low price
4. Committee votes:
   - 6/8 members vote for BID-023 (Dell) — Best value for money, proven track record
   - 2/8 members vote for BID-034 (Lenovo) — Lowest price

**Outputs**:
- Winning bid selected: BID-023 (Dell India, ₹4,200,000)
- Decision justification logged: "Committee prioritized quality and past performance over lowest price. Dell's 5-year track record and superior ML score (0.89) justified 3.6% price premium over Lenovo."

---

#### Step 10: Award Contract Decision (Exclusive Gateway)
**BPMN Node**: `Gateway_FinalDecision`

**Condition Evaluation**:
- **Award Contract**: `${awardContract == true}` → Route to `Task_GenerateAwardLetter`
- **Reject All**: `${awardContract == false}` → End process (retender)

**Outputs**:
- Contract awarded to Dell India
- Notification sent to Finance for contract signing

---

#### Step 11: Generate Award Letter (Service Task)
**BPMN Node**: `Task_GenerateAwardLetter`  
**Service Topic**: `award-letter`

**Actions**:
1. Generates PDF award letter with HPCL letterhead
2. Content:
   - Award to: Dell India
   - Contract Value: ₹42,00,000
   - Tender Reference: TENDER-2025-05-001
   - Delivery Timeline: 45 days from PO date
   - Payment Terms: Net 30 after delivery and installation
   - Validity: 60 days from award date

**Outputs**:
- PDF award letter saved to document repository
- Award letter ID: `AWARD-2025-05-001`

---

#### Step 12: Notify Winning Vendor (Service Task)
**BPMN Node**: `Task_NotifyVendor`  
**Service Topic**: `notify-vendor`

**Actions**:
1. Sends email to Dell India contact: procurement@dell.com
2. Email content:
   - Subject: "Contract Awarded — TENDER-2025-05-001"
   - Body: "Congratulations! You have been awarded the contract. Award letter attached. Please acknowledge receipt within 7 days."
   - Attachments: Award letter PDF, Tender document
3. Vendor portal notification: "New contract awarded to you — TENDER-2025-05-001"

**Outputs**:
- Email delivery confirmation logged
- Vendor acknowledgment tracked (awaiting response)

---

#### Step 13: Create PO from Tender (Call Activity)
**BPMN Node**: `CallActivity_CreatePO`  
**Called Process**: `PR_to_PO_Process`

**Actions**:
1. Auto-creates PR based on tender award:
   - PR Description: "IT Hardware as per TENDER-2025-05-001 awarded to Dell India"
   - Estimated Value: ₹42,00,000
   - Vendor: Dell India
2. Calls `PR_to_PO_Process` (skips classification, budget check as already done in tender)
3. Directly routes to PO generation and SAP sync

**Outputs**:
- PO created: `PO-2025-06-001`
- SAP PO number: `4500012400`
- Contract execution begins

---

#### Step 14: End Event (Contract Awarded)
**BPMN Node**: `EndEvent_Success`

**Outputs**:
- Bid evaluation cycle time: Bids Collected (Day 30) → Contract Awarded (Day 32) = **2 days** (vs 7-14 days manual)
- Complete audit trail: OCR extractions, compliance checks, ML scores, committee votes, award justification

---

## Workflow 4: Exception Handling Process

### Trigger Event
Any exception in PR to PO or Tender workflows (budget breach, rule violation, SAP failure, document missing)

### Detailed Flow

#### Step 1: Classify Exception Type (Service Task)
**BPMN Node**: `Task_ClassifyException`  
**Service Topic**: `classify-exception`

**Actions**:
1. Analyzes exception data:
   - Exception type: "SAP API Timeout"
   - Source workflow: PR_to_PO_Process
   - PR ID: PR-2025-05-002
   - Timestamp: 2025-05-15 14:30:00
2. Maps to severity:
   - **Critical**: Rule violation, budget breach ≥20%, compliance failure
   - **Major**: SAP sync failure, document missing, vendor blacklisted
   - **Minor**: Timeout, notification failure, missing optional field

**Outputs**:
- Exception classified as `MAJOR`
- Exception ID: `EXC-2025-05-001`

---

#### Step 2: Severity-Based Routing (Exclusive Gateway)
**BPMN Node**: `Gateway_SeverityLevel`

**Condition Evaluation**:
- **Critical**: `${severity == 'critical'}` → Alert CVO, Freeze workflow
- **Major**: `${severity == 'major'}` → Route to Department Manager
- **Minor**: `${severity == 'minor'}` → Auto-retry with fallback

**Example**: SAP timeout classified as MAJOR, routed to Department Manager

---

#### Step 3: Manager Review (User Task) — Major Path
**BPMN Node**: `Task_ManagerReview`  
**Candidate Group**: `department-managers`

**Actions**:
1. Manager reviews exception details:
   - Error: "SAP API timeout after 3 retries (5s, 10s, 15s)"
   - Impact: PO not synced to SAP, PR stuck in `PO_GENERATED` status
   - Options:
     - **Resolve**: Manually sync to SAP, mark as resolved
     - **Escalate to MD**: If SAP system-wide issue
2. Manager decision: "SAP team confirmed system was down for maintenance. Manually synced PO to SAP. Mark as resolved."

**Outputs**:
- Manager applies fix, completes task with `managerAction = 'resolve'`

---

#### Step 4: Apply Fix (Service Task)
**BPMN Node**: `Task_ApplyFix`  
**Service Topic**: `apply-fix`

**Actions**:
1. Executes manager's fix:
   - Manual SAP sync via direct BAPI call
   - Logs override in audit trail: "Manager override: Manual SAP sync due to system downtime"
2. Validates fix successful: SAP PO number received

**Outputs**:
- Fix applied, exception resolved
- Original workflow resumed

---

#### Step 5: Resume Workflow (Service Task)
**BPMN Node**: `Task_ResumeWorkflow`  
**Service Topic**: `resume-workflow`

**Actions**:
1. Sends signal to original workflow (`PR_to_PO_Process` instance)
2. Workflow resumes from `Task_SAPSync` node
3. PR status updated to `SAP_SYNCED`

**Outputs**:
- PR-2025-05-002 completes successfully
- Exception resolution time: 4 hours (vs 3-5 days manual escalation)

---

#### Step 6: Audit Log (Service Task)
**BPMN Node**: `Task_AuditLog`  
**Service Topic**: `audit-exception`

**Actions**:
1. Logs complete exception timeline:
   - Exception triggered: 14:30:00
   - Classified as MAJOR: 14:30:05
   - Routed to Manager: 14:30:10
   - Manager reviewed: 16:15:00
   - Fix applied: 16:30:00
   - Workflow resumed: 16:35:00
   - Exception resolved: 18:30:00
2. Total resolution time: 4 hours

**Outputs**:
- Immutable audit trail for CVC compliance
- Exception metrics dashboard updated (average resolution time, top exception types)

---

## Process Metrics & KPIs

### Cycle Time Targets

| **Process** | **Manual (Current)** | **Automated (Target)** | **Improvement** |
|-----------|---------------------|------------------------|-----------------|
| PR to PO (<₹50K) | 3-5 days | 2-4 hours | 95% |
| PR to PO (₹50K-₹5L) | 5-10 days | 6-12 hours | 90% |
| PR to PO (>₹5L) | 10-20 days | 1-3 days | 85% |
| Tender Publication | 2-4 hours | 10-15 min | 90% |
| Bid Evaluation | 3-7 days | 4-8 hours | 95% |
| Exception Resolution | 3-10 days | 4-24 hours | 90% |

### Compliance Metrics

| **Metric** | **Current** | **Target** |
|-----------|-----------|-----------|
| CVC Compliance Rate | 85% | 99.5% |
| Audit Trail Completeness | 70% | 100% |
| Non-Compliance Incidents | 15/month | <1/month |
| Audit Report Generation Time | 5-10 hours | <5 min |

### Efficiency Metrics

| **Metric** | **Current** | **Target** |
|-----------|-----------|-----------|
| PRs Processed per Buyer per Month | 17 | 50 |
| Approver Response Time | 24-48 hours | 2-4 hours |
| SAP Data Entry Errors | 20% | <1% |
| Budget Check Turnaround | 4-24 hours | 2-5 sec |

---

**Document Version**: 1.0  
**Last Updated**: May 2025  
**Owner**: HPCL Digital Transformation Team
