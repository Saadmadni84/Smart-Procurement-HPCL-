# SAP Integration Specification
## HPCL Procurement Automation System

### Document Information
- **Version**: 1.0
- **Last Updated**: 2025-11-21
- **Owner**: SAP Integration Team
- **Status**: Draft - Pending SAP SME Review

---

## 1. Overview

This document specifies the integration patterns, data mappings, error handling, and testing strategies for integrating the HPCL Procurement Automation System with SAP ERP.

### 1.1 Integration Objectives

- **Bi-directional Sync**: PR data from Procurement System → SAP, PO status from SAP → Procurement System
- **Real-time Processing**: PO creation within 5 seconds (p95)
- **Idempotency**: Prevent duplicate PO creation with business key
- **Error Handling**: Retry logic, dead-letter queue, manual fallback
- **Audit Trail**: Log all API calls, responses, errors
- **Data Integrity**: Validate data before/after sync

### 1.2 Integration Scope

| Flow | Direction | Frequency | Method |
|------|-----------|-----------|--------|
| Create PO | Procurement → SAP | Real-time (event-driven) | BAPI/OData |
| Update PO | Procurement → SAP | Real-time | BAPI/OData |
| Get PO Status | SAP → Procurement | Real-time + Polling (every 5 min) | BAPI/OData |
| Create GRN | Procurement → SAP | Real-time | BAPI |
| Post Invoice | Procurement → SAP | Real-time | BAPI |
| Sync Vendor Master | SAP → Procurement | Batch (daily 2 AM) | RFC/IDoc |
| Sync Material Master | SAP → Procurement | Batch (daily 2 AM) | RFC/IDoc |

---

## 2. Integration Architecture

### 2.1 Preferred Approach: SAP Cloud Platform Integration (CPI)

**Architecture:**
```
Procurement System → Kong API Gateway → SAP CPI → SAP ERP (S/4HANA)
```

**Rationale:**
- **API Gateway**: CPI provides REST API facade over complex BAPIs
- **Rate Limiting**: CPI handles throttling, prevents SAP overload
- **Monitoring**: Built-in dashboards, alerting
- **Security**: OAuth 2.0, mutual TLS
- **Decoupling**: Changes in SAP don't impact Procurement System

**Prerequisites:**
- SAP CPI subscription and configuration
- CPI integration flows deployed (iFlows)
- OAuth client credentials for Procurement System

---

### 2.2 Fallback Approach: Direct BAPI/RFC Calls

**Architecture:**
```
Procurement System → SAP JCo Connector → SAP ERP (RFC)
```

**Rationale:**
- **No CPI Dependency**: Direct RFC connection
- **Lower Latency**: Fewer network hops
- **Legacy Support**: Works with older SAP versions

**Prerequisites:**
- SAP JCo library (Java Connector)
- RFC user credentials with BAPI execution permissions
- Network connectivity to SAP application server (port 3300)

**When to Use:**
- CPI unavailable or not procured
- Low transaction volume (< 100 POs/day)
- Internal network deployment only

---

## 3. Data Mapping Specification

### 3.1 Purchase Order Creation (PR → SAP PO)

#### Procurement System PR Schema
```json
{
  "pr_id": "PR-2025-05-001",
  "pr_number": "PR-2025-05-001",
  "description": "5 Dell Laptops for IT Department",
  "category": "IT_HARDWARE",
  "estimated_value": 250000.00,
  "currency": "INR",
  "requestor": {
    "employee_id": "EMP001",
    "name": "John Doe",
    "department": "IT",
    "cost_center": "CC-IT-001"
  },
  "items": [
    {
      "item_number": 10,
      "description": "Dell Latitude 5430 Laptop",
      "quantity": 5,
      "unit_of_measure": "EA",
      "unit_price": 50000.00,
      "total_price": 250000.00,
      "material_code": "MAT-LAP-001",
      "delivery_date": "2025-12-15"
    }
  ],
  "supplier": {
    "supplier_code": "VENDOR-001",
    "supplier_name": "ABC Supplies Pvt Ltd",
    "gstin": "29ABCDE1234F1Z5"
  },
  "approvals": [
    {
      "approver": "CFO",
      "approval_date": "2025-11-20T14:30:00Z",
      "status": "APPROVED"
    }
  ]
}
```

#### SAP BAPI: BAPI_PO_CREATE1

**Input Structure:**

| Field | SAP Field | Table | Mapping | Mandatory |
|-------|-----------|-------|---------|-----------|
| PR ID | `EKES-BSTNR` | EKES | `pr_number` | No (reference) |
| PO Document Type | `EKKO-BSART` | EKKO | `"NB"` (Standard PO) | Yes |
| Purchasing Org | `EKKO-EKORG` | EKKO | `"1000"` (HPCL) | Yes |
| Purchasing Group | `EKKO-EKGRP` | EKKO | `"001"` | Yes |
| Company Code | `EKKO-BUKRS` | EKKO | `"1000"` | Yes |
| Vendor | `EKKO-LIFNR` | EKKO | `supplier.supplier_code` | Yes |
| Currency | `EKKO-WAERS` | EKKO | `currency` (INR) | Yes |
| Document Date | `EKKO-BEDAT` | EKKO | `CURRENT_DATE` | Yes |
| Created By | `EKKO-ERNAM` | EKKO | `requestor.employee_id` | Yes |

**Line Items (EKPO):**

| Field | SAP Field | Table | Mapping | Mandatory |
|-------|-----------|-------|---------|-----------|
| Item Number | `EKPO-EBELP` | EKPO | `item_number` (10, 20, 30...) | Yes |
| Material | `EKPO-MATNR` | EKPO | `material_code` | Yes |
| Short Text | `EKPO-TXZ01` | EKPO | `description` (40 chars) | Yes |
| Quantity | `EKPO-MENGE` | EKPO | `quantity` | Yes |
| Unit of Measure | `EKPO-MEINS` | EKPO | `unit_of_measure` | Yes |
| Net Price | `EKPO-NETPR` | EKPO | `unit_price` | Yes |
| Price Unit | `EKPO-PEINH` | EKPO | `1` | Yes |
| Plant | `EKPO-WERKS` | EKPO | `"1000"` (HPCL Plant) | Yes |
| Storage Location | `EKPO-LGORT` | EKPO | `"0001"` | No |
| Delivery Date | `EKPO-EINDT` | EKPO | `delivery_date` | Yes |
| Cost Center | `EKKN-KOSTL` | EKKN | `requestor.cost_center` | Yes |
| GL Account | `EKKN-SAKTO` | EKKN | `"600100"` (IT Expense) | Yes |

**Account Assignment (EKKN):**

| Field | SAP Field | Table | Mapping | Mandatory |
|-------|-----------|-------|---------|-----------|
| Item Number | `EKKN-EBELP` | EKKN | `item_number` | Yes |
| Account Assignment Number | `EKKN-ZEKKN` | EKKN | `01` | Yes |
| Account Assignment Category | `EKKN-KNTTP` | EKKN | `"K"` (Cost Center) | Yes |
| Cost Center | `EKKN-KOSTL` | EKKN | `requestor.cost_center` | Yes |
| GL Account | `EKKN-SAKTO` | EKKN | `"600100"` | Yes |
| Quantity | `EKKN-MENGE` | EKKN | `quantity` | Yes |

---

### 3.2 Sample BAPI Request (Java)

```java
import com.sap.conn.jco.*;

public class SAPPOCreator {
    
    public String createPO(PurchaseRequest pr) throws JCoException {
        JCoDestination destination = JCoDestinationManager.getDestination("SAP_SYSTEM");
        JCoFunction function = destination.getRepository().getFunction("BAPI_PO_CREATE1");
        
        if (function == null) {
            throw new RuntimeException("BAPI_PO_CREATE1 not found in SAP");
        }
        
        // Header Data
        JCoStructure poHeader = function.getImportParameterList().getStructure("PO_HEADER");
        poHeader.setValue("COMP_CODE", "1000");     // Company Code
        poHeader.setValue("DOC_TYPE", "NB");        // Standard PO
        poHeader.setValue("CREAT_DATE", new Date()); // Today
        poHeader.setValue("VENDOR", pr.getSupplier().getSupplierCode());
        poHeader.setValue("PURCH_ORG", "1000");     // HPCL
        poHeader.setValue("PUR_GROUP", "001");      // Purchasing Group
        poHeader.setValue("CURRENCY", "INR");
        
        // Header Text
        JCoStructure poHeaderX = function.getImportParameterList().getStructure("PO_HEADERX");
        poHeaderX.setValue("COMP_CODE", "X");
        poHeaderX.setValue("DOC_TYPE", "X");
        poHeaderX.setValue("VENDOR", "X");
        poHeaderX.setValue("PURCH_ORG", "X");
        poHeaderX.setValue("PUR_GROUP", "X");
        poHeaderX.setValue("CURRENCY", "X");
        
        // Line Items
        JCoTable poItems = function.getTableParameterList().getTable("PO_ITEMS");
        int itemIndex = 10;
        for (PRItem item : pr.getItems()) {
            poItems.appendRow();
            poItems.setValue("PO_ITEM", String.format("%05d", itemIndex));
            poItems.setValue("MATERIAL", item.getMaterialCode());
            poItems.setValue("SHORT_TEXT", item.getDescription().substring(0, 40));
            poItems.setValue("QUANTITY", item.getQuantity());
            poItems.setValue("UNIT", item.getUnitOfMeasure());
            poItems.setValue("NET_PRICE", item.getUnitPrice());
            poItems.setValue("PRICE_UNIT", 1);
            poItems.setValue("PLANT", "1000");
            poItems.setValue("DELIV_DATE", item.getDeliveryDate());
            itemIndex += 10;
        }
        
        JCoTable poItemsX = function.getTableParameterList().getTable("PO_ITEMSX");
        itemIndex = 10;
        for (PRItem item : pr.getItems()) {
            poItemsX.appendRow();
            poItemsX.setValue("PO_ITEM", String.format("%05d", itemIndex));
            poItemsX.setValue("MATERIAL", "X");
            poItemsX.setValue("SHORT_TEXT", "X");
            poItemsX.setValue("QUANTITY", "X");
            poItemsX.setValue("UNIT", "X");
            poItemsX.setValue("NET_PRICE", "X");
            poItemsX.setValue("PLANT", "X");
            poItemsX.setValue("DELIV_DATE", "X");
            itemIndex += 10;
        }
        
        // Account Assignment
        JCoTable poAccountAssignment = function.getTableParameterList().getTable("PO_ACCOUNT");
        itemIndex = 10;
        for (PRItem item : pr.getItems()) {
            poAccountAssignment.appendRow();
            poAccountAssignment.setValue("PO_ITEM", String.format("%05d", itemIndex));
            poAccountAssignment.setValue("SERIAL_NO", "01");
            poAccountAssignment.setValue("ACCTASSCAT", "K");  // Cost Center
            poAccountAssignment.setValue("COSTCENTER", pr.getRequestor().getCostCenter());
            poAccountAssignment.setValue("GL_ACCOUNT", "600100");
            poAccountAssignment.setValue("QUANTITY", item.getQuantity());
            itemIndex += 10;
        }
        
        // Execute BAPI
        function.execute(destination);
        
        // Check for errors
        JCoStructure returnStructure = function.getExportParameterList().getStructure("RETURN");
        String messageType = returnStructure.getString("TYPE");
        String message = returnStructure.getString("MESSAGE");
        
        if ("E".equals(messageType) || "A".equals(messageType)) {
            throw new SAPException("SAP Error: " + message);
        }
        
        // Get PO Number
        String poNumber = function.getExportParameterList().getString("PO_NUMBER");
        
        // Commit transaction
        JCoFunction commitFunction = destination.getRepository().getFunction("BAPI_TRANSACTION_COMMIT");
        commitFunction.getImportParameterList().setValue("WAIT", "X");
        commitFunction.execute(destination);
        
        return poNumber;
    }
}
```

---

### 3.3 Sample OData Request (REST API via CPI)

**Endpoint:** `POST https://sap-cpi.hpcl.com/api/v1/purchase-orders`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Idempotency-Key: PR-2025-05-001-1732189200
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

**Request Body:**
```json
{
  "externalReference": "PR-2025-05-001",
  "companyCode": "1000",
  "documentType": "NB",
  "purchasingOrganization": "1000",
  "purchasingGroup": "001",
  "vendor": "VENDOR-001",
  "currency": "INR",
  "documentDate": "2025-11-21",
  "createdBy": "EMP001",
  "items": [
    {
      "itemNumber": "00010",
      "materialCode": "MAT-LAP-001",
      "description": "Dell Latitude 5430 Laptop",
      "quantity": 5.0,
      "unitOfMeasure": "EA",
      "netPrice": 50000.00,
      "priceUnit": 1,
      "plant": "1000",
      "deliveryDate": "2025-12-15",
      "accountAssignment": {
        "category": "K",
        "costCenter": "CC-IT-001",
        "glAccount": "600100"
      }
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "poNumber": "4500012345",
  "externalReference": "PR-2025-05-001",
  "status": "CREATED",
  "createdAt": "2025-11-21T10:30:00Z",
  "items": [
    {
      "itemNumber": "00010",
      "sapItemNumber": "00010",
      "status": "CREATED"
    }
  ],
  "message": "Purchase Order created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VENDOR_NOT_FOUND",
    "message": "Vendor VENDOR-001 does not exist in SAP",
    "details": [
      {
        "field": "vendor",
        "value": "VENDOR-001",
        "issue": "Vendor master data not found"
      }
    ]
  },
  "timestamp": "2025-11-21T10:30:00Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 4. Idempotency Strategy

### 4.1 Idempotency Key Generation

**Format:** `{PR_ID}-{UNIX_TIMESTAMP}`

**Example:** `PR-2025-05-001-1732189200`

**Logic:**
```java
public String generateIdempotencyKey(String prId) {
    long timestamp = Instant.now().getEpochSecond();
    return String.format("%s-%d", prId, timestamp);
}
```

### 4.2 Idempotency Handling

**On Procurement System:**
1. Generate idempotency key before SAP call
2. Store in `integration_logs` table with status `IN_PROGRESS`
3. Send key in `Idempotency-Key` header
4. On response, update status to `SUCCESS` or `FAILED`
5. On retry, check if `integration_logs` has `SUCCESS` for same key → skip SAP call

**On SAP CPI:**
1. Check if `Idempotency-Key` exists in cache (Redis, 24h TTL)
2. If exists → return cached response (HTTP 200)
3. If not exists → execute BAPI, cache response, return

**Benefits:**
- Prevents duplicate PO creation on network timeouts
- Enables safe retries without side effects

---

## 5. Error Handling & Retry Policy

### 5.1 Error Classification

| Error Type | SAP Code | HTTP Code | Action | Retry |
|------------|----------|-----------|--------|-------|
| **Transient** | Connection timeout | 504 | Retry with backoff | Yes |
| **Transient** | SAP system busy | 503 | Retry with backoff | Yes |
| **Transient** | Temporary lock | SAP_LOCK_ERROR | Retry with backoff | Yes |
| **Permanent** | Vendor not found | 400 | Create exception, manual fix | No |
| **Permanent** | Invalid material | 400 | Create exception, manual fix | No |
| **Permanent** | Insufficient budget | SAP_BUDGET_ERROR | Create exception, approval required | No |
| **Permanent** | Authentication failed | 401 | Alert admin, check credentials | No |
| **Permanent** | Authorization failed | 403 | Alert admin, check permissions | No |

### 5.2 Retry Configuration

**Exponential Backoff:**
```
Retry 1: Wait 2 seconds
Retry 2: Wait 4 seconds
Retry 3: Wait 8 seconds
Max Retries: 3
Total Max Wait: 14 seconds
```

**Implementation (Spring Boot):**
```java
@Retryable(
    value = {SAPTransientException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 2000, multiplier = 2)
)
public String createPOWithRetry(PurchaseRequest pr) throws SAPException {
    return sapAdapter.createPO(pr);
}

@Recover
public String recoverFromSAPFailure(SAPTransientException e, PurchaseRequest pr) {
    log.error("SAP PO creation failed after 3 retries for PR: {}", pr.getPrId());
    exceptionService.createException(pr, "SAP_SYNC_FAILED", e.getMessage());
    return null; // Trigger manual fallback
}
```

### 5.3 Dead-Letter Queue (DLQ)

**When all retries fail:**
1. Publish failed message to Kafka DLQ topic: `sap.po.create.dlq`
2. Create exception record in database
3. Send alert to SAP integration team (email, Slack)
4. Manual intervention required (check SAP logs, fix data, replay from DLQ)

**DLQ Message Format:**
```json
{
  "pr_id": "PR-2025-05-001",
  "idempotency_key": "PR-2025-05-001-1732189200",
  "failed_at": "2025-11-21T10:35:00Z",
  "retry_count": 3,
  "last_error": "SAP_VENDOR_NOT_FOUND",
  "last_error_message": "Vendor VENDOR-001 does not exist",
  "original_request": { ... },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 6. Transaction Boundaries & Consistency

### 6.1 Eventual Consistency Model

**Rationale:**
- SAP is external system, cannot participate in 2PC (two-phase commit)
- Network failures can cause partial updates
- Prefer eventual consistency with compensating actions

**Flow:**
1. **Local Transaction**: Update PR status to `SYNCING` in MySQL (committed)
2. **Remote Call**: Call SAP BAPI (may fail)
3. **Reconciliation**: 
   - On success: Update PR status to `COMPLETED`
   - On failure: Retry → DLQ → Manual fix

### 6.2 Compensating Actions

**Scenario**: PO created in SAP but Procurement System crashes before updating local status

**Detection**: Daily reconciliation job (runs at 3 AM)
```sql
SELECT pr.pr_id, pr.status, il.sap_po_id
FROM purchase_requests pr
LEFT JOIN integration_logs il ON pr.pr_id = il.pr_id
WHERE pr.status = 'SYNCING'
  AND il.status = 'SUCCESS'
  AND pr.updated_at < NOW() - INTERVAL 1 HOUR;
```

**Compensation**: Update PR status to `COMPLETED`, log discrepancy

**Reverse Scenario**: Local PR marked `COMPLETED` but SAP PO creation failed

**Detection**: Check integration_logs for `FAILED` with status `COMPLETED`

**Compensation**: Revert PR status to `APPROVED`, create exception, retry

---

## 7. Monitoring & Observability

### 7.1 Key Metrics (Prometheus)

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|-----------------|
| `sap_po_create_total` | Counter | Total PO creation attempts | N/A |
| `sap_po_create_success` | Counter | Successful PO creations | N/A |
| `sap_po_create_failure` | Counter | Failed PO creations | > 10/hour |
| `sap_po_create_duration_seconds` | Histogram | PO creation latency | p95 > 5s |
| `sap_po_retry_total` | Counter | Retry attempts | > 50/hour |
| `sap_dlq_messages` | Gauge | Messages in DLQ | > 0 |
| `sap_connection_errors` | Counter | Connection failures | > 5/hour |

### 7.2 Logging

**Log Format (JSON):**
```json
{
  "timestamp": "2025-11-21T10:30:00.123Z",
  "level": "INFO",
  "service": "sap-adapter",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "pr_id": "PR-2025-05-001",
  "operation": "CREATE_PO",
  "idempotency_key": "PR-2025-05-001-1732189200",
  "sap_po_id": "4500012345",
  "duration_ms": 1234,
  "status": "SUCCESS"
}
```

**Log Levels:**
- `DEBUG`: Request/response payloads (dev/staging only)
- `INFO`: Successful operations
- `WARN`: Retries, temporary failures
- `ERROR`: Permanent failures, exceptions

---

## 8. Security

### 8.1 Authentication

**Option 1: OAuth 2.0 (CPI)**
- Client credentials flow
- JWT token with 1-hour expiry
- Token caching to avoid repeated auth calls

**Option 2: Basic Auth (Direct RFC)**
- RFC user credentials
- Encrypted in transit (TLS 1.3)
- Stored in HashiCorp Vault

### 8.2 Authorization

**SAP User Permissions (T-Code: SU01):**
- `ME21N`: Create PO
- `ME22N`: Change PO
- `ME23N`: Display PO
- BAPI execution: `S_RFC` authorization object

### 8.3 Network Security

- **Firewall Rules**: Whitelist Procurement System IP
- **TLS 1.3**: Encrypted in transit
- **mTLS**: Mutual certificate authentication (optional)

---

## 9. Testing Strategy

### 9.1 SAP Sandbox Testing

**Prerequisites:**
- SAP sandbox environment access
- Test vendor master data (VENDOR-TEST-001)
- Test material master data (MAT-TEST-001)
- Test cost center (CC-TEST-001)

**Test Scenarios:**

| Scenario | Input | Expected Output | Pass Criteria |
|----------|-------|-----------------|---------------|
| **Happy Path** | Valid PR with all fields | PO created, PO number returned | SAP PO exists, status = CREATED |
| **Invalid Vendor** | Non-existent vendor | Error: VENDOR_NOT_FOUND | HTTP 400, exception created |
| **Invalid Material** | Non-existent material | Error: MATERIAL_NOT_FOUND | HTTP 400, exception created |
| **Missing Cost Center** | Null cost center | Error: COST_CENTER_REQUIRED | HTTP 400, validation failed |
| **Idempotency** | Same idempotency key twice | 2nd call returns cached PO | Same PO number, no duplicate |
| **Timeout** | SAP delay > 30s | Timeout, retry triggered | Retry successful, PO created |
| **Network Failure** | Disconnect network mid-call | Connection error, retry | Retry successful after reconnect |
| **Concurrent Calls** | 10 PRs in parallel | All POs created | 10 unique PO numbers |

### 9.2 Integration Test Plan

**Test Data:**
```json
{
  "pr_id": "PR-TEST-001",
  "supplier_code": "VENDOR-TEST-001",
  "material_code": "MAT-TEST-001",
  "cost_center": "CC-TEST-001",
  "quantity": 1,
  "unit_price": 1000.00
}
```

**Automated Test (JUnit + Mockito):**
```java
@Test
public void testCreatePO_Success() {
    PurchaseRequest pr = createTestPR();
    
    when(sapClient.callBAPI("BAPI_PO_CREATE1", any()))
        .thenReturn(new BAPIResponse("4500012345", "SUCCESS"));
    
    String poNumber = sapAdapter.createPO(pr);
    
    assertEquals("4500012345", poNumber);
    verify(integrationLogRepository).save(argThat(log -> 
        log.getStatus() == IntegrationStatus.SUCCESS
    ));
}

@Test
public void testCreatePO_VendorNotFound() {
    PurchaseRequest pr = createTestPR();
    
    when(sapClient.callBAPI("BAPI_PO_CREATE1", any()))
        .thenThrow(new SAPException("VENDOR_NOT_FOUND"));
    
    assertThrows(SAPException.class, () -> sapAdapter.createPO(pr));
    verify(exceptionService).createException(pr, "SAP_SYNC_FAILED", any());
}
```

---

## 10. Rollout Plan

### Phase 1: Sandbox Testing (Week 1)
- SAP sandbox connectivity test
- BAPI execution with test data
- Error scenario testing

### Phase 2: Staging Deployment (Week 2-3)
- Deploy SAP adapter to staging
- Integration with staging SAP system
- End-to-end testing (PR → PO → GRN)

### Phase 3: Production Pilot (Week 4)
- Deploy to production with feature flag
- Enable for 10% of PRs (canary)
- Monitor metrics, errors for 1 week

### Phase 4: Full Rollout (Week 5)
- Enable for 100% of PRs
- Decommission manual PO creation process

---

## 11. Acceptance Criteria

✅ **SAP sandbox connectivity confirmed**
✅ **BAPI_PO_CREATE1 successfully creates PO with test data**
✅ **Idempotency key prevents duplicate PO creation**
✅ **Retry logic tested with network failures**
✅ **Error handling covers all scenarios (vendor not found, material missing, etc.)**
✅ **Integration logs capture all API calls**
✅ **Monitoring metrics and alerts configured**
✅ **Security validated (OAuth, TLS, least privilege)**
✅ **Performance target met (p95 < 5s)**
✅ **SAP SME reviewed and approved spec**

---

## 12. Appendix

### A. SAP Table Reference

| Table | Description |
|-------|-------------|
| EKKO | PO Header |
| EKPO | PO Line Items |
| EKKN | Account Assignment |
| EKES | Vendor Confirmation |
| LFA1 | Vendor Master |
| MARA | Material Master |
| T001 | Company Codes |

### B. BAPI Return Codes

| Code | Message Type | Description |
|------|--------------|-------------|
| S | Success | Operation successful |
| E | Error | Operation failed (permanent) |
| W | Warning | Operation successful with warnings |
| I | Information | Informational message |
| A | Abort | Operation aborted (permanent) |

### C. Contact Information

- **SAP SME**: sap-team@hpcl.com
- **SAP Basis Team**: sap-basis@hpcl.com
- **Integration Support**: integration-support@hpcl.com

---

**Document Owner**: SAP Integration Team  
**Last Updated**: 2025-11-21  
**Next Review**: 2025-12-21
