# SAP Integration Service Specification

## Overview
The SAP Integration Service provides bidirectional connectivity between the HPCL Procurement System and SAP ERP for budget checks, vendor management, PO creation, and invoice processing.

---

## Technology Stack
- **Framework**: Spring Boot 3.2.2
- **SAP Connector**: SAP JCo (Java Connector) 3.1.x
- **Integration Methods**: BAPI (Business API), IDoc (Intermediate Document), OData v4
- **Protocol**: RFC (Remote Function Call), HTTPS
- **Authentication**: SAP SSO (Single Sign-On) OR Basic Auth
- **Message Queue**: RabbitMQ (async integration)
- **Retry Mechanism**: Spring Retry with exponential backoff

---

## SAP Integration Patterns

### 1. Synchronous (BAPI/RFC)
- **Use Case**: Real-time budget checks, vendor lookup, PO creation
- **Response Time**: 2-5 seconds
- **Error Handling**: Immediate retry (3 attempts)

### 2. Asynchronous (IDoc)
- **Use Case**: Bulk data sync (vendor master, material master), invoice posting
- **Processing Time**: 5-30 minutes (batch processing)
- **Error Handling**: Dead letter queue, manual reconciliation

### 3. RESTful (OData)
- **Use Case**: Modern SAP S/4HANA integration, real-time data queries
- **Response Time**: 1-3 seconds
- **Error Handling**: HTTP status codes, retry logic

---

## API Endpoints

### 1. Check Budget Availability

**Endpoint**: `POST /api/sap/budget-check`

**Description**: Real-time budget check against SAP cost center

**Request Body**:
```json
{
  "prId": "PR-2025-05-001",
  "costCenter": "CC-IT-1001",
  "estimatedValue": 250000,
  "fiscalYear": "2025",
  "budgetCode": "IT-CAPEX-2025",
  "companyCode": "HPCL"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "budgetAvailable": true,
  "remainingBudget": 1500000,
  "allocatedBudget": 2000000,
  "committedBudget": 250000,
  "actualSpent": 250000,
  "costCenter": "CC-IT-1001",
  "fiscalYear": "2025",
  "budgetCode": "IT-CAPEX-2025",
  "currency": "INR",
  "checkedAt": "2025-11-20T10:00:10Z",
  "sapResponse": {
    "returnCode": "000",
    "message": "Budget check successful"
  }
}
```

**Budget Unavailable Response**:
```json
{
  "success": false,
  "budgetAvailable": false,
  "remainingBudget": 0,
  "allocatedBudget": 2000000,
  "committedBudget": 1500000,
  "actualSpent": 500000,
  "shortfall": 250000,
  "costCenter": "CC-IT-1001",
  "fiscalYear": "2025",
  "recommendation": "Request budget reallocation from Finance Manager",
  "sapResponse": {
    "returnCode": "E01",
    "message": "Insufficient budget in cost center CC-IT-1001"
  }
}
```

**SAP Error Response** (502 Bad Gateway):
```json
{
  "success": false,
  "errorCode": "SAP_TIMEOUT",
  "message": "SAP system did not respond within 5 seconds",
  "retriesAttempted": 3,
  "lastRetryAt": "2025-11-20T10:00:25Z",
  "recommendation": "SAP system may be down. Contact SAP admin or retry manually."
}
```

---

### 2. Get Vendor Details

**Endpoint**: `GET /api/sap/vendor/{vendorCode}`

**Description**: Fetches vendor master data from SAP

**Path Parameters**:
- `vendorCode` (string, required): SAP vendor code (e.g., "VENDOR-DELL-001")

**Response** (200 OK):
```json
{
  "vendorCode": "VENDOR-DELL-001",
  "vendorName": "Dell India Private Limited",
  "legalName": "Dell India Pvt Ltd",
  "gstNumber": "27AABCU9603R1Z5",
  "panNumber": "AABCU9603R",
  "address": {
    "street": "Embassy Tech Village, Outer Ring Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pinCode": "560103",
    "country": "IN"
  },
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountNumber": "50200012345678",
    "ifscCode": "HDFC0000123",
    "branch": "Koramangala, Bangalore"
  },
  "paymentTerms": "Net 30",
  "currency": "INR",
  "category": ["IT Hardware", "IT Services"],
  "rating": 4.5,
  "blacklisted": false,
  "activeContracts": 12,
  "lastPurchaseDate": "2025-10-15",
  "totalPurchaseValue": 25000000,
  "sapStatus": "ACTIVE",
  "createdDate": "2018-05-10",
  "lastModified": "2025-09-20"
}
```

---

### 3. Create Purchase Order in SAP

**Endpoint**: `POST /api/sap/create-po`

**Description**: Creates PO in SAP ERP and returns SAP PO number

**Request Body**:
```json
{
  "poId": "PO-2025-05-001",
  "vendorCode": "VENDOR-DELL-001",
  "companyCode": "HPCL",
  "purchasingOrg": "HPCL-PO",
  "purchasingGroup": "IT-PROCUREMENT",
  "documentType": "NB",
  "poDate": "2025-11-20",
  "deliveryDate": "2025-12-20",
  "paymentTerms": "Net 30",
  "currency": "INR",
  "lineItems": [
    {
      "itemNumber": 10,
      "materialCode": "MAT-LAPTOP-001",
      "shortText": "Dell Latitude 5540 Laptop",
      "quantity": 5,
      "unit": "EA",
      "netPrice": 50000,
      "totalValue": 250000,
      "costCenter": "CC-IT-1001",
      "glAccount": "GL-650000",
      "deliveryDate": "2025-12-20",
      "plant": "HPCL-MUM",
      "storageLocation": "IT-STORE-01"
    }
  ],
  "textNotes": [
    {
      "textId": "F01",
      "textLine": "PR Reference: PR-2025-05-001. Approved by IT Head on 2025-11-18."
    }
  ],
  "idempotencyKey": "po-2025-05-001-20251120-100030"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "localPoId": "PO-2025-05-001",
  "sapPoNumber": "4500012345",
  "documentType": "NB",
  "companyCode": "HPCL",
  "vendorCode": "VENDOR-DELL-001",
  "vendorName": "Dell India Pvt Ltd",
  "totalValue": 250000,
  "currency": "INR",
  "createdAt": "2025-11-20T10:05:00Z",
  "createdBy": "HPCL_BUYER_123",
  "sapStatus": "CREATED",
  "sapUrl": "https://sap.hpcl.com/po/4500012345",
  "sapResponse": {
    "returnCode": "000",
    "message": "Purchase Order 4500012345 created successfully"
  }
}
```

**SAP Error Response** (400 Bad Request):
```json
{
  "success": false,
  "errorCode": "SAP_VALIDATION_ERROR",
  "message": "SAP PO creation failed due to validation errors",
  "sapErrors": [
    {
      "type": "E",
      "id": "ME",
      "number": "022",
      "message": "Vendor VENDOR-DELL-001 is blocked for purchasing organization HPCL-PO",
      "field": "VENDOR"
    },
    {
      "type": "E",
      "id": "ME",
      "number": "045",
      "message": "Cost center CC-IT-1001 is blocked for new commitments",
      "field": "COST_CENTER"
    }
  ],
  "recommendation": "Resolve vendor block or use alternative vendor. Contact Finance for cost center issue."
}
```

---

### 4. Sync Purchase Requisition to SAP

**Endpoint**: `POST /api/sap/sync-pr`

**Description**: Creates/updates PR in SAP (optional, if SAP PR workflow is used)

**Request Body**:
```json
{
  "prId": "PR-2025-05-001",
  "documentType": "NB",
  "createdBy": "BUYER_123",
  "prDate": "2025-11-20",
  "items": [
    {
      "itemNumber": 10,
      "materialCode": "MAT-LAPTOP-001",
      "shortText": "Dell Latitude 5540",
      "quantity": 5,
      "unit": "EA",
      "deliveryDate": "2025-12-20",
      "costCenter": "CC-IT-1001",
      "glAccount": "GL-650000",
      "estimatedPrice": 50000
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "localPrId": "PR-2025-05-001",
  "sapPrNumber": "1000012345",
  "sapStatus": "RELEASED",
  "createdAt": "2025-11-20T10:00:30Z"
}
```

---

### 5. Post Invoice to SAP

**Endpoint**: `POST /api/sap/post-invoice`

**Description**: Posts vendor invoice to SAP (MIRO transaction)

**Request Body**:
```json
{
  "invoiceNumber": "INV-DELL-2025-5678",
  "invoiceDate": "2025-11-15",
  "vendorCode": "VENDOR-DELL-001",
  "companyCode": "HPCL",
  "fiscalYear": "2025",
  "currency": "INR",
  "grossAmount": 262500,
  "taxAmount": 12500,
  "baselineDate": "2025-11-15",
  "paymentTerms": "Net 30",
  "poReference": "4500012345",
  "items": [
    {
      "poNumber": "4500012345",
      "poItem": "10",
      "quantity": 5,
      "amount": 250000,
      "taxCode": "I1"
    }
  ],
  "idempotencyKey": "invoice-dell-2025-5678-20251120"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "invoiceNumber": "INV-DELL-2025-5678",
  "sapInvoiceDocNumber": "5105678901",
  "fiscalYear": "2025",
  "postingDate": "2025-11-20",
  "paymentDueDate": "2025-12-20",
  "status": "POSTED",
  "sapResponse": {
    "returnCode": "000",
    "message": "Invoice document 5105678901 posted successfully"
  }
}
```

---

### 6. Get Material Master Data

**Endpoint**: `GET /api/sap/material/{materialCode}`

**Description**: Fetches material/item details from SAP

**Response** (200 OK):
```json
{
  "materialCode": "MAT-LAPTOP-001",
  "materialDescription": "Dell Latitude 5540 Laptop",
  "materialGroup": "IT-HARDWARE",
  "baseUnit": "EA",
  "materialType": "FERT",
  "plant": "HPCL-MUM",
  "storageLocation": "IT-STORE-01",
  "valuationClass": "3000",
  "standardPrice": 50000,
  "movingPrice": 48500,
  "currency": "INR",
  "stockQuantity": 120,
  "availableStock": 95,
  "lastPurchasePrice": 49000,
  "lastPurchaseDate": "2025-10-15",
  "sapStatus": "ACTIVE"
}
```

---

## Service Implementation (Spring Boot)

### SAP JCo Configuration

```java
@Configuration
public class SapJCoConfig {
    
    @Value("${sap.jco.ashost}")
    private String ashost;
    
    @Value("${sap.jco.sysnr}")
    private String sysnr;
    
    @Value("${sap.jco.client}")
    private String client;
    
    @Value("${sap.jco.user}")
    private String user;
    
    @Value("${sap.jco.passwd}")
    private String passwd;
    
    @Value("${sap.jco.lang}")
    private String lang;
    
    @Bean
    public JCoDestination sapDestination() throws JCoException {
        Properties props = new Properties();
        props.setProperty(DestinationDataProvider.JCO_ASHOST, ashost);
        props.setProperty(DestinationDataProvider.JCO_SYSNR, sysnr);
        props.setProperty(DestinationDataProvider.JCO_CLIENT, client);
        props.setProperty(DestinationDataProvider.JCO_USER, user);
        props.setProperty(DestinationDataProvider.JCO_PASSWD, passwd);
        props.setProperty(DestinationDataProvider.JCO_LANG, lang);
        props.setProperty(DestinationDataProvider.JCO_POOL_CAPACITY, "10");
        props.setProperty(DestinationDataProvider.JCO_PEAK_LIMIT, "10");
        
        return JCoDestinationManager.getDestination("HPCL_SAP");
    }
}
```

### Budget Check Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SapBudgetService {
    
    private final JCoDestination sapDestination;
    private final AuditLogRepository auditLogRepository;
    
    @Retryable(
        value = {JCoException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public SapBudgetCheckResponse checkBudget(SapBudgetCheckRequest request) {
        try {
            // 1. Get BAPI function
            JCoFunction function = sapDestination.getRepository()
                    .getFunction("BAPI_ACC_BUDGET_CHECK");
            
            if (function == null) {
                throw new SapIntegrationException("BAPI_ACC_BUDGET_CHECK not found in SAP");
            }
            
            // 2. Set import parameters
            JCoParameterList importParams = function.getImportParameterList();
            importParams.setValue("COMPANYCODE", "HPCL");
            importParams.setValue("COSTCENTER", request.getCostCenter());
            importParams.setValue("FISCALYEAR", request.getFiscalYear());
            importParams.setValue("AMOUNT", request.getEstimatedValue());
            importParams.setValue("CURRENCY", "INR");
            
            // 3. Execute RFC call
            function.execute(sapDestination);
            
            // 4. Read export parameters
            JCoParameterList exportParams = function.getExportParameterList();
            String returnCode = exportParams.getString("RETURN_CODE");
            String message = exportParams.getString("MESSAGE");
            BigDecimal remainingBudget = exportParams.getBigDecimal("REMAINING_BUDGET");
            BigDecimal allocatedBudget = exportParams.getBigDecimal("ALLOCATED_BUDGET");
            
            // 5. Log audit trail
            auditLogRepository.save(new AuditLog()
                    .setPrId(request.getPrId())
                    .setEventType("SAP_BUDGET_CHECK")
                    .setUserId("system")
                    .setComment(String.format("Budget check: %s (₹%s remaining)", 
                            returnCode, remainingBudget))
                    .setTimestamp(LocalDateTime.now()));
            
            // 6. Build response
            return SapBudgetCheckResponse.builder()
                    .success(returnCode.equals("000"))
                    .budgetAvailable(remainingBudget.compareTo(request.getEstimatedValue()) >= 0)
                    .remainingBudget(remainingBudget)
                    .allocatedBudget(allocatedBudget)
                    .costCenter(request.getCostCenter())
                    .fiscalYear(request.getFiscalYear())
                    .sapReturnCode(returnCode)
                    .sapMessage(message)
                    .checkedAt(LocalDateTime.now())
                    .build();
            
        } catch (JCoException e) {
            log.error("SAP Budget Check failed for PR {}: {}", request.getPrId(), e.getMessage());
            throw new SapIntegrationException("SAP Budget Check failed: " + e.getMessage(), e);
        }
    }
}
```

### PO Creation Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SapPoService {
    
    private final JCoDestination sapDestination;
    private final PoRepository poRepository;
    private final IdempotencyService idempotencyService;
    
    @Transactional
    @Retryable(
        value = {JCoException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public SapPoCreateResponse createPo(SapPoCreateRequest request) {
        // 1. Idempotency check
        if (idempotencyService.isProcessed(request.getIdempotencyKey())) {
            log.info("Duplicate PO creation request detected: {}", request.getIdempotencyKey());
            return idempotencyService.getResponse(request.getIdempotencyKey());
        }
        
        try {
            // 2. Get BAPI function
            JCoFunction function = sapDestination.getRepository()
                    .getFunction("BAPI_PO_CREATE1");
            
            // 3. Set PO header
            JCoStructure poHeader = function.getImportParameterList().getStructure("PO_HEADER");
            poHeader.setValue("COMP_CODE", request.getCompanyCode());
            poHeader.setValue("DOC_TYPE", request.getDocumentType());
            poHeader.setValue("VENDOR", request.getVendorCode());
            poHeader.setValue("PURCH_ORG", request.getPurchasingOrg());
            poHeader.setValue("PUR_GROUP", request.getPurchasingGroup());
            poHeader.setValue("DOC_DATE", request.getPoDate());
            poHeader.setValue("CURRENCY", request.getCurrency());
            
            // 4. Set PO line items
            JCoTable poItems = function.getTableParameterList().getTable("PO_ITEMS");
            for (SapPoLineItem item : request.getLineItems()) {
                poItems.appendRow();
                poItems.setValue("PO_ITEM", item.getItemNumber());
                poItems.setValue("MATERIAL", item.getMaterialCode());
                poItems.setValue("SHORT_TEXT", item.getShortText());
                poItems.setValue("QUANTITY", item.getQuantity());
                poItems.setValue("PO_UNIT", item.getUnit());
                poItems.setValue("NET_PRICE", item.getNetPrice());
                poItems.setValue("DELIV_DATE", item.getDeliveryDate());
                poItems.setValue("PLANT", item.getPlant());
                poItems.setValue("STGE_LOC", item.getStorageLocation());
            }
            
            // 5. Set account assignment
            JCoTable poAccounts = function.getTableParameterList().getTable("PO_ITEM_ACCOUNT_ASSIGNMENT");
            for (SapPoLineItem item : request.getLineItems()) {
                poAccounts.appendRow();
                poAccounts.setValue("PO_ITEM", item.getItemNumber());
                poAccounts.setValue("SERIAL_NO", "01");
                poAccounts.setValue("COSTCENTER", item.getCostCenter());
                poAccounts.setValue("GL_ACCOUNT", item.getGlAccount());
                poAccounts.setValue("QUANTITY", item.getQuantity());
            }
            
            // 6. Execute BAPI
            function.execute(sapDestination);
            
            // 7. Read return messages
            JCoTable returnTable = function.getTableParameterList().getTable("RETURN");
            List<SapMessage> messages = parseSapMessages(returnTable);
            
            // 8. Check for errors
            boolean hasErrors = messages.stream().anyMatch(m -> m.getType().equals("E"));
            if (hasErrors) {
                throw new SapValidationException("SAP PO creation failed", messages);
            }
            
            // 9. Get SAP PO number
            String sapPoNumber = function.getExportParameterList().getString("PURCHASEORDER");
            
            // 10. Commit BAPI transaction
            JCoFunction commitFunction = sapDestination.getRepository()
                    .getFunction("BAPI_TRANSACTION_COMMIT");
            commitFunction.getImportParameterList().setValue("WAIT", "X");
            commitFunction.execute(sapDestination);
            
            // 11. Update local PO record
            PurchaseOrder po = poRepository.findByPoId(request.getPoId()).orElseThrow();
            po.setSapPoNumber(sapPoNumber);
            po.setSapStatus("CREATED");
            po.setSapSyncedAt(LocalDateTime.now());
            poRepository.save(po);
            
            // 12. Build response
            SapPoCreateResponse response = SapPoCreateResponse.builder()
                    .success(true)
                    .localPoId(request.getPoId())
                    .sapPoNumber(sapPoNumber)
                    .sapStatus("CREATED")
                    .createdAt(LocalDateTime.now())
                    .sapReturnCode("000")
                    .sapMessage("PO created successfully")
                    .build();
            
            // 13. Store idempotency record
            idempotencyService.storeResponse(request.getIdempotencyKey(), response);
            
            return response;
            
        } catch (JCoException e) {
            log.error("SAP PO creation failed for PO {}: {}", request.getPoId(), e.getMessage());
            throw new SapIntegrationException("SAP PO creation failed: " + e.getMessage(), e);
        }
    }
    
    private List<SapMessage> parseSapMessages(JCoTable returnTable) {
        List<SapMessage> messages = new ArrayList<>();
        for (int i = 0; i < returnTable.getNumRows(); i++) {
            returnTable.setRow(i);
            messages.add(new SapMessage(
                    returnTable.getString("TYPE"),
                    returnTable.getString("ID"),
                    returnTable.getString("NUMBER"),
                    returnTable.getString("MESSAGE"),
                    returnTable.getString("MESSAGE_V1")
            ));
        }
        return messages;
    }
}
```

---

## Error Handling & Retry Logic

### Retry Configuration

```yaml
spring:
  retry:
    sap:
      maxAttempts: 3
      backoff:
        delay: 2000
        multiplier: 2
        maxDelay: 10000
```

### Idempotency Service

```java
@Service
@RequiredArgsConstructor
public class IdempotencyService {
    
    private final IdempotencyRepository idempotencyRepository;
    
    public boolean isProcessed(String idempotencyKey) {
        return idempotencyRepository.existsByIdempotencyKey(idempotencyKey);
    }
    
    public <T> T getResponse(String idempotencyKey) {
        return idempotencyRepository.findByIdempotencyKey(idempotencyKey)
                .map(record -> (T) deserialize(record.getResponse()))
                .orElse(null);
    }
    
    public <T> void storeResponse(String idempotencyKey, T response) {
        IdempotencyRecord record = new IdempotencyRecord()
                .setIdempotencyKey(idempotencyKey)
                .setResponse(serialize(response))
                .setCreatedAt(LocalDateTime.now());
        idempotencyRepository.save(record);
    }
}
```

---

## Performance Metrics

| **Operation** | **Target** | **Actual** | **Timeout** |
|--------------|----------|-----------|------------|
| Budget Check | <3 sec | 2-3 sec | 5 sec |
| Vendor Lookup | <2 sec | 1-2 sec | 5 sec |
| PO Creation | <5 sec | 3-5 sec | 10 sec |
| Invoice Posting | <5 sec | 3-6 sec | 10 sec |
| Material Lookup | <2 sec | 1-2 sec | 5 sec |

---

## Security

### Connection Security
- VPN tunnel between HPCL network and SAP ERP
- SAP JCo connection pooling (max 10 connections)
- Encrypted RFC communication (SNC - Secure Network Communication)

### Authentication
- Dedicated SAP service account: `HPCL_PROCUREMENT_SVC`
- Password rotation every 90 days
- Role-based authorization in SAP (transaction codes: ME21N, ME22N, MIRO, FMB1)

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Owner**: HPCL Digital Transformation Team
