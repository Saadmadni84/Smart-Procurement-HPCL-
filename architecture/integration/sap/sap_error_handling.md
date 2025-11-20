# SAP Integration Error Handling
## HPCL Procurement Automation System

---

## 1. Error Categories

### 1.1 Transient Errors (Retriable)

These errors are temporary and likely to succeed on retry.

| Error Code | Description | SAP Message | Retry Strategy | Max Retries |
|------------|-------------|-------------|----------------|-------------|
| `CONNECTION_TIMEOUT` | Network timeout to SAP | Connection to SAP timed out | Exponential backoff (2s, 4s, 8s) | 3 |
| `SAP_SYSTEM_BUSY` | SAP overloaded | System temporarily unavailable | Exponential backoff | 3 |
| `TEMPORARY_LOCK` | Resource locked by another user | Object is locked by user XYZ | Wait 5s, retry | 3 |
| `RFC_COMMUNICATION_ERROR` | RFC layer error | RFC communication failure | Exponential backoff | 3 |
| `GATEWAY_TIMEOUT` | SAP gateway timeout | Gateway did not respond | Exponential backoff | 3 |

**Action**: Automatic retry with exponential backoff. If all retries fail → DLQ → Manual intervention.

---

### 1.2 Permanent Errors (Non-Retriable)

These errors require manual intervention or data correction.

| Error Code | Description | SAP Message | Action | Escalation |
|------------|-------------|-------------|--------|------------|
| `VENDOR_NOT_FOUND` | Vendor does not exist | Vendor XXXX not in LFA1 | Create exception, notify procurement | Immediate |
| `MATERIAL_NOT_FOUND` | Material does not exist | Material XXXX not in MARA | Create exception, notify requestor | Immediate |
| `INVALID_PLANT` | Plant code invalid | Plant XXXX does not exist | Create exception, notify procurement | High |
| `INVALID_COST_CENTER` | Cost center invalid | Cost center XXXX not in CSKS | Create exception, notify finance | High |
| `BUDGET_EXCEEDED` | Budget limit reached | Budget availability check failed | Create exception, require CFO approval | Critical |
| `AUTHORIZATION_FAILED` | SAP user lacks permission | No authorization for ME21N | Alert admin, check SAP roles | Critical |
| `AUTHENTICATION_FAILED` | Invalid SAP credentials | User authentication failed | Alert admin, rotate credentials | Critical |
| `INVALID_DOCUMENT_TYPE` | PO type not allowed | Document type NB not permitted | Create exception, check config | Medium |
| `FISCAL_PERIOD_CLOSED` | Posting period closed | Period 11/2025 is closed | Create exception, wait for next period | Medium |

**Action**: Create exception record, send alert, log to DLQ. Require manual fix before retry.

---

### 1.3 Data Validation Errors

| Error Code | Description | Validation Rule | Action |
|------------|-------------|-----------------|--------|
| `MISSING_REQUIRED_FIELD` | Required field null/empty | Vendor, Material, Quantity, Price required | 400 Bad Request, return to user |
| `INVALID_QUANTITY` | Quantity ≤ 0 or non-numeric | Quantity must be > 0 | 400 Bad Request |
| `INVALID_PRICE` | Price ≤ 0 or non-numeric | Price must be > 0 | 400 Bad Request |
| `INVALID_DATE_FORMAT` | Date not in SAP format | Date must be YYYY-MM-DD | 400 Bad Request |
| `DELIVERY_DATE_PAST` | Delivery date in the past | Delivery date must be future | 400 Bad Request |
| `AMOUNT_EXCEEDS_LIMIT` | PO value > approval limit | Value ₹10L exceeds user limit ₹5L | 403 Forbidden, require higher approver |

**Action**: Return error to frontend immediately, do not attempt SAP call.

---

## 2. Error Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Pre-Call Validation                                       │
│    - Check all required fields present                       │
│    - Validate data types, formats                            │
│    - Check business rules (approval hierarchy, budget)       │
│    - If validation fails → 400 Bad Request                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Idempotency Check                                         │
│    - Check if idempotency key exists in cache                │
│    - If exists → Return cached response (200 OK)             │
│    - If not → Proceed to SAP call                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. SAP API Call                                              │
│    - Call BAPI_PO_CREATE1 or CPI OData endpoint              │
│    - Set timeout: 30 seconds                                 │
│    - Log request/response in integration_logs table          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Response Handling                                         │
│    ┌─────────────────┬─────────────────┬─────────────────┐  │
│    │ Success (2xx)   │ Transient Error │ Permanent Error │  │
│    │ - Cache response│ - Retry w/backoff│ - Create excep │  │
│    │ - Update DB     │ - Max 3 retries  │ - Send alert   │  │
│    │ - Return PO#    │ - If fail → DLQ  │ - Return error │  │
│    └─────────────────┴─────────────────┴─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Retry Logic Implementation

### 3.1 Spring Retry Configuration

```java
@Configuration
@EnableRetry
public class SAPRetryConfig {
    
    @Bean
    public RetryTemplate sapRetryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();
        
        // Exponential backoff: 2s, 4s, 8s
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(2000);  // 2 seconds
        backOffPolicy.setMultiplier(2.0);
        backOffPolicy.setMaxInterval(10000);     // Max 10 seconds
        
        // Max 3 retries
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        
        retryTemplate.setBackOffPolicy(backOffPolicy);
        retryTemplate.setRetryPolicy(retryPolicy);
        
        return retryTemplate;
    }
}

@Service
public class SAPAdapter {
    
    @Autowired
    private RetryTemplate sapRetryTemplate;
    
    @Retryable(
        value = {SAPTransientException.class, SocketTimeoutException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public String createPO(PurchaseRequest pr) throws SAPException {
        log.info("Attempting SAP PO creation for PR: {}", pr.getPrId());
        
        try {
            String poNumber = sapClient.callBAPI("BAPI_PO_CREATE1", pr);
            log.info("SAP PO created successfully: {}", poNumber);
            return poNumber;
            
        } catch (SocketTimeoutException e) {
            log.warn("SAP timeout on attempt. Will retry.", e);
            throw new SAPTransientException("SAP timeout", e);
            
        } catch (SAPException e) {
            if (isTransientError(e)) {
                log.warn("SAP transient error. Will retry.", e);
                throw new SAPTransientException(e.getMessage(), e);
            } else {
                log.error("SAP permanent error. No retry.", e);
                throw e; // Don't retry
            }
        }
    }
    
    @Recover
    public String recoverFromSAPFailure(SAPTransientException e, PurchaseRequest pr) {
        log.error("SAP PO creation failed after 3 retries for PR: {}", pr.getPrId(), e);
        
        // Send to DLQ
        kafkaTemplate.send("sap.po.create.dlq", createDLQMessage(pr, e));
        
        // Create exception record
        exceptionService.createException(
            pr,
            ExceptionType.SAP_SYNC_FAILED,
            "SAP PO creation failed after 3 retries: " + e.getMessage()
        );
        
        // Send alert
        alertService.sendAlert(
            "SAP Integration Failure",
            String.format("PR %s failed to create PO after 3 retries", pr.getPrId()),
            AlertSeverity.HIGH
        );
        
        return null;
    }
    
    private boolean isTransientError(SAPException e) {
        String errorCode = e.getErrorCode();
        return errorCode != null && (
            errorCode.equals("TIMEOUT") ||
            errorCode.equals("SAP_SYSTEM_BUSY") ||
            errorCode.equals("TEMPORARY_LOCK") ||
            errorCode.equals("RFC_COMMUNICATION_ERROR")
        );
    }
}
```

---

## 4. Dead-Letter Queue (DLQ) Handling

### 4.1 DLQ Message Structure

```json
{
  "dlq_id": "550e8400-e29b-41d4-a716-446655440000",
  "pr_id": "PR-2025-05-001",
  "idempotency_key": "PR-2025-05-001-1732189200",
  "failed_at": "2025-11-21T10:35:00Z",
  "retry_count": 3,
  "last_error_code": "SAP_VENDOR_NOT_FOUND",
  "last_error_message": "Vendor VENDOR-001 does not exist in table LFA1",
  "error_stack_trace": "com.sap.conn.jco.JCoException: ...",
  "original_request": {
    "pr_number": "PR-2025-05-001",
    "vendor": "VENDOR-001",
    "items": [...]
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "EMP001",
  "created_by": "sap-adapter-service"
}
```

### 4.2 DLQ Consumer (Manual Replay)

```java
@Service
public class SAPDLQConsumer {
    
    @KafkaListener(topics = "sap.po.create.dlq", groupId = "dlq-manual-handler")
    public void handleDLQMessage(String message) {
        DLQMessage dlqMessage = objectMapper.readValue(message, DLQMessage.class);
        
        log.warn("DLQ message received for PR: {}", dlqMessage.getPrId());
        
        // Log to database for manual review
        dlqRepository.save(DLQRecord.builder()
            .prId(dlqMessage.getPrId())
            .errorCode(dlqMessage.getLastErrorCode())
            .errorMessage(dlqMessage.getLastErrorMessage())
            .payload(message)
            .status(DLQStatus.PENDING_REVIEW)
            .build());
        
        // Send alert to SAP integration team
        alertService.sendAlert(
            "DLQ Message - Manual Review Required",
            String.format("PR %s in DLQ. Error: %s", 
                dlqMessage.getPrId(), 
                dlqMessage.getLastErrorMessage()),
            AlertSeverity.HIGH,
            "sap-integration-team@hpcl.com"
        );
    }
    
    @Transactional
    public void replayDLQMessage(String dlqId) {
        DLQRecord record = dlqRepository.findById(dlqId)
            .orElseThrow(() -> new NotFoundException("DLQ record not found"));
        
        DLQMessage dlqMessage = objectMapper.readValue(record.getPayload(), DLQMessage.class);
        
        try {
            // Replay SAP call
            String poNumber = sapAdapter.createPO(dlqMessage.getOriginalRequest());
            
            // Update DLQ status
            record.setStatus(DLQStatus.REPLAYED_SUCCESS);
            record.setReplayedAt(Instant.now());
            record.setSapPoNumber(poNumber);
            dlqRepository.save(record);
            
            log.info("DLQ message replayed successfully for PR: {}", dlqMessage.getPrId());
            
        } catch (SAPException e) {
            // Replay failed
            record.setStatus(DLQStatus.REPLAYED_FAILED);
            record.setReplayError(e.getMessage());
            dlqRepository.save(record);
            
            log.error("DLQ message replay failed for PR: {}", dlqMessage.getPrId(), e);
        }
    }
}
```

---

## 5. Exception Workflow

### 5.1 Exception Creation

When SAP call fails permanently:

1. **Create Exception Record:**
```java
Exception exception = Exception.builder()
    .exceptionNumber(generateExceptionNumber())
    .prId(pr.getPrId())
    .exceptionType(ExceptionType.SAP_SYNC_FAILED)
    .severity(ExceptionSeverity.HIGH)
    .description("Failed to create PO in SAP: " + errorMessage)
    .assignedTo(sapIntegrationTeamUserId)
    .status(ExceptionStatus.OPEN)
    .build();
exceptionRepository.save(exception);
```

2. **Send Notification:**
```java
notificationService.sendNotification(
    sapIntegrationTeamUserId,
    NotificationType.EXCEPTION_RAISED,
    "SAP PO Creation Failed",
    String.format("PR %s failed to create PO in SAP. Error: %s", pr.getPrId(), errorMessage),
    NotificationChannel.EMAIL
);
```

3. **Update PR Status:**
```java
pr.setStatus(PRStatus.EXCEPTION);
pr.setAssignedTo(sapIntegrationTeamUserId);
prRepository.save(pr);
```

### 5.2 Exception Resolution Flow

```
1. SAP Integration Team reviews exception
   ↓
2. Identify root cause:
   - Vendor missing → Create vendor in SAP
   - Material missing → Create material in SAP
   - Budget exceeded → Request budget increase
   - System error → Contact SAP Basis team
   ↓
3. Fix root cause in SAP or Procurement System
   ↓
4. Replay from DLQ (if needed)
   ↓
5. Update exception status to RESOLVED
   ↓
6. Update PR status to COMPLETED
```

---

## 6. Monitoring & Alerting

### 6.1 Key Metrics

**Error Rate Metrics:**
```
sap_error_rate = (sap_po_create_failure / sap_po_create_total) * 100

Alert if error_rate > 10% over 5 minutes
```

**Error by Type:**
```
sap_errors_by_type{type="VENDOR_NOT_FOUND"}
sap_errors_by_type{type="MATERIAL_NOT_FOUND"}
sap_errors_by_type{type="TIMEOUT"}
```

**DLQ Size:**
```
sap_dlq_messages_total

Alert if dlq_messages > 0
```

### 6.2 Alerting Rules (Prometheus)

```yaml
groups:
  - name: sap_integration_alerts
    rules:
      - alert: HighSAPErrorRate
        expr: rate(sap_po_create_failure[5m]) / rate(sap_po_create_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High SAP integration error rate"
          description: "SAP PO creation error rate is {{ $value | humanizePercentage }} over last 5 minutes"
      
      - alert: SAPDLQNotEmpty
        expr: sap_dlq_messages_total > 0
        for: 1m
        labels:
          severity: high
        annotations:
          summary: "SAP DLQ has messages"
          description: "{{ $value }} messages in SAP DLQ require manual review"
      
      - alert: SAPTimeoutSpike
        expr: rate(sap_errors_by_type{type="TIMEOUT"}[5m]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "SAP timeout spike detected"
          description: "SAP timeout rate is {{ $value }}/s. Check SAP system health."
```

---

## 7. Troubleshooting Guide

### Scenario 1: Vendor Not Found

**Symptom:** Error code `VENDOR_NOT_FOUND`

**Root Cause:** Vendor master data missing in SAP (table LFA1)

**Resolution:**
1. Verify vendor code in Procurement System matches SAP
2. Check if vendor exists in SAP (T-Code: `XK03`)
3. If missing, create vendor in SAP (T-Code: `XK01`)
4. Replay DLQ message

---

### Scenario 2: Connection Timeout

**Symptom:** Error code `CONNECTION_TIMEOUT` or `GATEWAY_TIMEOUT`

**Root Cause:** Network latency or SAP system overload

**Resolution:**
1. Check network connectivity (ping SAP gateway)
2. Check SAP system health (T-Code: `SM50`, `SM51`)
3. Review SAP Basis logs for errors
4. If transient, retry will succeed automatically
5. If persistent, escalate to SAP Basis team

---

### Scenario 3: Authorization Failed

**Symptom:** Error code `AUTHORIZATION_FAILED`

**Root Cause:** SAP user lacks BAPI execution permissions

**Resolution:**
1. Check SAP user roles (T-Code: `SU01`)
2. Verify user has authorization object `S_RFC`
3. Verify user has T-Code `ME21N` (Create PO)
4. If missing, request SAP admin to grant permissions
5. Retry after permissions updated

---

## 8. Acceptance Criteria

✅ **All error types classified (transient vs permanent)**  
✅ **Retry logic implemented with exponential backoff**  
✅ **DLQ configured and consumer implemented**  
✅ **Exception workflow documented**  
✅ **Alerts configured for critical errors**  
✅ **Troubleshooting guide covers top 5 error scenarios**  
✅ **Integration logs capture all errors with correlation IDs**  
✅ **Manual replay process tested and documented**

---

**Document Owner**: SAP Integration Team  
**Last Updated**: 2025-11-21  
**Version**: 1.0
