# Workflow Service Specification

## Overview
The Workflow Service acts as a REST API wrapper around the BPMN engine (Camunda/Flowable), exposing process management endpoints for PR creation, tender publication, bid evaluation, and exception handling.

---

## Technology Stack
- **Framework**: Spring Boot 3.2.2
- **BPMN Engine**: Camunda Platform 8 (Zeebe) OR Flowable 7.x
- **Language**: Java 17
- **API Protocol**: REST (JSON)
- **Authentication**: JWT Bearer Token
- **Authorization**: Role-based access control (RBAC)

---

## API Endpoints

### 1. Start PR to PO Workflow

**Endpoint**: `POST /api/workflow/pr/start`

**Description**: Initiates a new PR to PO workflow instance

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "description": "5 Dell Laptops for IT Department",
  "estimatedValue": 250000,
  "currency": "INR",
  "vendorName": "Dell India",
  "vendorCode": "VENDOR-DELL-001",
  "department": "IT",
  "costCenter": "CC-IT-1001",
  "requiredByDate": "2025-06-15",
  "justification": "Replace 5-year-old laptops, Windows 11 upgrade required",
  "category": "IT Hardware",
  "requestorId": "buyer123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "prId": "PR-2025-05-001",
  "processInstanceId": "camunda-proc-12345",
  "status": "DRAFT",
  "currentStep": "Auto-Classification",
  "estimatedCompletionTime": "2025-05-15T12:00:00Z",
  "createdAt": "2025-05-15T10:00:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Required field missing: vendorName",
  "errors": [
    {
      "field": "vendorName",
      "message": "Vendor name is required"
    }
  ]
}
```

---

### 2. Get PR Workflow Status

**Endpoint**: `GET /api/workflow/pr/{prId}`

**Description**: Retrieves current status of a PR workflow

**Path Parameters**:
- `prId` (string, required): PR identifier (e.g., "PR-2025-05-001")

**Response** (200 OK):
```json
{
  "prId": "PR-2025-05-001",
  "processInstanceId": "camunda-proc-12345",
  "status": "PENDING_APPROVAL",
  "currentStep": "Manager Approval",
  "assignedTo": "manager_john",
  "timeline": [
    {
      "step": "PR Created",
      "timestamp": "2025-05-15T10:00:00Z",
      "actor": "buyer123"
    },
    {
      "step": "Auto-Classified",
      "timestamp": "2025-05-15T10:00:05Z",
      "actor": "system",
      "result": "Category: IT Hardware (confidence: 0.94)"
    },
    {
      "step": "Budget Check",
      "timestamp": "2025-05-15T10:00:10Z",
      "actor": "system",
      "result": "Budget Available: ₹15L in CC-IT-1001"
    },
    {
      "step": "Rule Validation",
      "timestamp": "2025-05-15T10:00:15Z",
      "actor": "system",
      "result": "2 rules triggered: CVC-01, IT-01"
    },
    {
      "step": "Manager Approval",
      "timestamp": "2025-05-15T10:30:00Z",
      "actor": "manager_john",
      "status": "PENDING"
    }
  ],
  "estimatedCompletionTime": "2025-05-15T14:00:00Z"
}
```

---

### 3. Submit Approval Decision

**Endpoint**: `POST /api/workflow/pr/{prId}/approve`

**Description**: Approver submits approval/rejection decision

**Request Body**:
```json
{
  "decision": "APPROVED",
  "comment": "Approved, align with IT refresh cycle",
  "approverId": "manager_john"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "prId": "PR-2025-05-001",
  "decision": "APPROVED",
  "nextStep": "IT Head Approval",
  "assignedTo": "it_head_jane",
  "message": "Approval recorded. Escalated to IT Head for final approval."
}
```

**Reject Request**:
```json
{
  "decision": "REJECTED",
  "comment": "Defer to Q3, budget constraints",
  "approverId": "manager_john"
}
```

**Reject Response**:
```json
{
  "success": true,
  "prId": "PR-2025-05-001",
  "decision": "REJECTED",
  "status": "CLOSED",
  "message": "PR rejected by Manager. Buyer notified."
}
```

---

### 4. Start Tender Workflow

**Endpoint**: `POST /api/workflow/tender/start`

**Description**: Initiates a new tender publication workflow

**Request Body**:
```json
{
  "tenderTitle": "Annual IT Hardware Procurement FY 2025-26",
  "tenderType": "OPEN",
  "estimatedValue": 5000000,
  "tenderDocumentUrl": "https://hpcl-docs.s3.ap-south-1.amazonaws.com/TENDER-2025-05-001.pdf",
  "bidDeadline": "2025-06-30T23:59:59Z",
  "preBidMeetingDate": "2025-06-10T15:00:00Z",
  "emdAmount": 50000,
  "technicalSpecs": {
    "category": "IT Hardware",
    "minSpecs": "16GB RAM, 512GB SSD, Windows 11 Pro"
  },
  "evaluationCriteria": {
    "price": 0.4,
    "deliveryTime": 0.2,
    "pastPerformance": 0.2,
    "quality": 0.1,
    "certifications": 0.1
  },
  "initiatorId": "buyer123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "tenderId": "TENDER-2025-05-001",
  "processInstanceId": "camunda-proc-12346",
  "status": "PENDING_COMMITTEE_APPROVAL",
  "currentStep": "Committee Approval",
  "createdAt": "2025-05-15T11:00:00Z"
}
```

---

### 5. Publish Tender

**Endpoint**: `POST /api/workflow/tender/{tenderId}/publish`

**Description**: Triggers parallel publication to CPPP, GeM, and vendor emails (after committee approval)

**Response** (200 OK):
```json
{
  "success": true,
  "tenderId": "TENDER-2025-05-001",
  "publicationStatus": {
    "cppp": {
      "status": "PUBLISHED",
      "cpppTenderId": "CPPP-TN-2025-12345",
      "publishedAt": "2025-05-15T12:00:00Z",
      "url": "https://cppp.gov.in/tender/CPPP-TN-2025-12345"
    },
    "gem": {
      "status": "PUBLISHED",
      "gemTenderId": "GEM-TN-2025-67890",
      "publishedAt": "2025-05-15T12:00:05Z",
      "url": "https://gem.gov.in/tender/GEM-TN-2025-67890"
    },
    "email": {
      "status": "SENT",
      "recipientCount": 200,
      "sentAt": "2025-05-15T12:00:10Z"
    }
  },
  "bidDeadline": "2025-06-30T23:59:59Z",
  "message": "Tender published successfully on all platforms"
}
```

---

### 6. Submit Bid Evaluation

**Endpoint**: `POST /api/workflow/tender/{tenderId}/evaluate`

**Description**: Triggers bid evaluation workflow (OCR, compliance, ML scoring, ranking)

**Request Body**:
```json
{
  "evaluatorId": "committee_member_1",
  "bidIds": ["BID-001", "BID-002", "BID-003", "..."] // Optional, evaluates all bids if omitted
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "tenderId": "TENDER-2025-05-001",
  "evaluationProcessId": "camunda-eval-98765",
  "status": "IN_PROGRESS",
  "estimatedCompletionTime": "2025-07-02T18:00:00Z",
  "message": "Bid evaluation started. 95 bids queued for processing."
}
```

---

### 7. Get Bid Evaluation Results

**Endpoint**: `GET /api/workflow/tender/{tenderId}/evaluation-results`

**Description**: Retrieves bid evaluation results (ML scores, rankings, compliance status)

**Response** (200 OK):
```json
{
  "tenderId": "TENDER-2025-05-001",
  "totalBids": 95,
  "compliantBids": 87,
  "disqualifiedBids": 8,
  "topBids": [
    {
      "bidId": "BID-023",
      "vendor": "Dell India",
      "totalPrice": 4200000,
      "mlScore": 0.89,
      "priceRank": 3,
      "qualityRank": 1,
      "complianceStatus": "COMPLIANT",
      "extractedFields": {
        "gstNumber": "27AABCU9603R1Z5",
        "deliveryTime": "45 days",
        "paymentTerms": "Net 30"
      }
    },
    {
      "bidId": "BID-056",
      "vendor": "HP India",
      "totalPrice": 4150000,
      "mlScore": 0.87,
      "priceRank": 2,
      "qualityRank": 2,
      "complianceStatus": "COMPLIANT"
    }
  ],
  "priceAnalysis": {
    "meanPrice": 4350000,
    "medianPrice": 4280000,
    "stdDeviation": 320000,
    "outliers": [
      {
        "bidId": "BID-089",
        "price": 6200000,
        "reason": "42% above mean"
      },
      {
        "bidId": "BID-012",
        "price": 2800000,
        "reason": "36% below mean (suspicious)"
      }
    ]
  },
  "evaluationCompletedAt": "2025-07-02T17:30:00Z"
}
```

---

### 8. Award Contract

**Endpoint**: `POST /api/workflow/tender/{tenderId}/award`

**Description**: Awards contract to winning bidder

**Request Body**:
```json
{
  "winningBidId": "BID-023",
  "committeeDecision": "APPROVED",
  "justification": "Committee prioritized quality and past performance over lowest price. Dell's 5-year track record and superior ML score (0.89) justified 3.6% price premium.",
  "approvers": [
    {"id": "committee_member_1", "vote": "APPROVED"},
    {"id": "committee_member_2", "vote": "APPROVED"},
    {"id": "committee_member_3", "vote": "APPROVED"},
    {"id": "committee_member_4", "vote": "APPROVED"},
    {"id": "committee_member_5", "vote": "APPROVED"}
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "tenderId": "TENDER-2025-05-001",
  "winningBidId": "BID-023",
  "vendor": "Dell India",
  "contractValue": 4200000,
  "awardLetterId": "AWARD-2025-05-001",
  "awardLetterUrl": "https://hpcl-docs.s3.ap-south-1.amazonaws.com/AWARD-2025-05-001.pdf",
  "poId": "PO-2025-06-001",
  "sapPoNumber": "4500012400",
  "message": "Contract awarded to Dell India. PO created and synced to SAP."
}
```

---

### 9. Trigger Exception Workflow

**Endpoint**: `POST /api/workflow/exception/trigger`

**Description**: Manually triggers exception handling workflow (usually auto-triggered by system)

**Request Body**:
```json
{
  "exceptionType": "SAP_SYNC_FAILURE",
  "sourceWorkflow": "PR_to_PO_Process",
  "sourceInstanceId": "camunda-proc-12345",
  "prId": "PR-2025-05-002",
  "errorDetails": {
    "errorCode": "SAP_TIMEOUT",
    "errorMessage": "SAP API timeout after 3 retries (5s, 10s, 15s)",
    "timestamp": "2025-05-15T14:30:00Z"
  },
  "severity": "MAJOR",
  "initiatorId": "system"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "exceptionId": "EXC-2025-05-001",
  "processInstanceId": "camunda-exc-55555",
  "severity": "MAJOR",
  "assignedTo": "department_manager",
  "slaHours": 24,
  "estimatedResolutionTime": "2025-05-16T14:30:00Z",
  "message": "Exception workflow triggered. Assigned to Department Manager for review."
}
```

---

### 10. Resolve Exception

**Endpoint**: `POST /api/workflow/exception/{exceptionId}/resolve`

**Description**: Resolves an exception (by approver/manager)

**Request Body**:
```json
{
  "resolutionAction": "MANUAL_SAP_SYNC",
  "comment": "SAP team confirmed system was down for maintenance. Manually synced PO to SAP.",
  "resolverId": "manager_john",
  "fixApplied": {
    "sapPoNumber": "4500012346",
    "syncTimestamp": "2025-05-15T16:30:00Z"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "exceptionId": "EXC-2025-05-001",
  "status": "RESOLVED",
  "resolutionTime": "2025-05-15T16:35:00Z",
  "originalWorkflowResumed": true,
  "prId": "PR-2025-05-002",
  "message": "Exception resolved. Original PR workflow resumed."
}
```

---

## Service Implementation (Spring Boot)

### Controller Layer

```java
@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController {
    
    private final WorkflowService workflowService;
    
    @PostMapping("/pr/start")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<PrWorkflowResponse> startPrWorkflow(
            @Valid @RequestBody PrCreateRequest request,
            @AuthenticationPrincipal UserDetails user) {
        PrWorkflowResponse response = workflowService.startPrWorkflow(request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/pr/{prId}")
    @PreAuthorize("hasAnyRole('BUYER', 'APPROVER', 'MANAGER', 'FINANCE')")
    public ResponseEntity<PrStatusResponse> getPrStatus(@PathVariable String prId) {
        PrStatusResponse response = workflowService.getPrStatus(prId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/pr/{prId}/approve")
    @PreAuthorize("hasRole('APPROVER')")
    public ResponseEntity<ApprovalResponse> submitApproval(
            @PathVariable String prId,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal UserDetails user) {
        ApprovalResponse response = workflowService.submitApproval(prId, request, user.getUsername());
        return ResponseEntity.ok(response);
    }
    
    // Additional endpoints for tender, evaluation, exception workflows...
}
```

### Service Layer (Camunda Integration)

```java
@Service
@RequiredArgsConstructor
public class WorkflowService {
    
    private final RuntimeService runtimeService; // Camunda
    private final TaskService taskService; // Camunda
    private final PrRepository prRepository;
    private final AuditLogRepository auditLogRepository;
    
    public PrWorkflowResponse startPrWorkflow(PrCreateRequest request, String requestorId) {
        // 1. Save PR to database
        PrRecord pr = new PrRecord()
                .setDescription(request.getDescription())
                .setEstimatedValue(request.getEstimatedValue())
                .setVendorName(request.getVendorName())
                .setDepartment(request.getDepartment())
                .setStatus("DRAFT")
                .setRequestorId(requestorId);
        pr = prRepository.save(pr);
        
        // 2. Start BPMN process instance
        Map<String, Object> variables = new HashMap<>();
        variables.put("prId", pr.getPrId());
        variables.put("estimatedValue", pr.getEstimatedValue());
        variables.put("category", request.getCategory());
        variables.put("requestorId", requestorId);
        
        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(
                "PR_to_PO_Process",
                pr.getPrId(),
                variables
        );
        
        // 3. Log audit trail
        auditLogRepository.save(new AuditLog()
                .setPrId(pr.getPrId())
                .setEventType("PR_CREATED")
                .setUserId(requestorId)
                .setTimestamp(LocalDateTime.now()));
        
        return new PrWorkflowResponse()
                .setPrId(pr.getPrId())
                .setProcessInstanceId(processInstance.getProcessInstanceId())
                .setStatus("DRAFT")
                .setCurrentStep("Auto-Classification");
    }
    
    public PrStatusResponse getPrStatus(String prId) {
        // 1. Fetch PR from database
        PrRecord pr = prRepository.findByPrId(prId)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found: " + prId));
        
        // 2. Query BPMN engine for process instance
        ProcessInstance processInstance = runtimeService.createProcessInstanceQuery()
                .processInstanceBusinessKey(prId)
                .singleResult();
        
        // 3. Get current user task (if any)
        Task currentTask = taskService.createTaskQuery()
                .processInstanceId(processInstance.getProcessInstanceId())
                .active()
                .singleResult();
        
        // 4. Fetch audit trail timeline
        List<AuditLog> timeline = auditLogRepository.findByPrIdOrderByTimestamp(prId);
        
        return new PrStatusResponse()
                .setPrId(pr.getPrId())
                .setStatus(pr.getStatus())
                .setCurrentStep(currentTask != null ? currentTask.getName() : "Completed")
                .setAssignedTo(currentTask != null ? currentTask.getAssignee() : null)
                .setTimeline(timeline);
    }
    
    public ApprovalResponse submitApproval(String prId, ApprovalDecisionRequest request, String approverId) {
        // 1. Find active user task for this PR
        Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(prId)
                .taskAssignee(approverId)
                .active()
                .singleResult();
        
        if (task == null) {
            throw new BusinessException("No pending approval task for user " + approverId);
        }
        
        // 2. Complete task with decision
        Map<String, Object> variables = new HashMap<>();
        variables.put("managerApproval", request.getDecision());
        variables.put("approvalComment", request.getComment());
        taskService.complete(task.getId(), variables);
        
        // 3. Update PR status
        PrRecord pr = prRepository.findByPrId(prId).orElseThrow();
        pr.setStatus(request.getDecision().equals("APPROVED") ? "APPROVED" : "REJECTED");
        prRepository.save(pr);
        
        // 4. Log audit trail
        auditLogRepository.save(new AuditLog()
                .setPrId(prId)
                .setEventType("APPROVAL_DECISION")
                .setUserId(approverId)
                .setComment(request.getComment())
                .setTimestamp(LocalDateTime.now()));
        
        return new ApprovalResponse()
                .setPrId(prId)
                .setDecision(request.getDecision())
                .setNextStep(request.getDecision().equals("APPROVED") ? "PO Generation" : "Closed");
    }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "errorCode": "WORKFLOW_ERROR",
  "message": "User-friendly error message",
  "timestamp": "2025-05-15T10:00:00Z",
  "errors": [
    {
      "field": "estimatedValue",
      "message": "Value must be greater than 0"
    }
  ]
}
```

### Common Error Codes

| **Error Code** | **HTTP Status** | **Description** |
|---------------|----------------|-----------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks required role for operation |
| `RESOURCE_NOT_FOUND` | 404 | PR/Tender/Exception not found |
| `WORKFLOW_ERROR` | 500 | BPMN engine internal error |
| `SAP_INTEGRATION_ERROR` | 502 | SAP API call failed |
| `DUPLICATE_REQUEST` | 409 | Duplicate PR detected |

---

## Security

### Authentication
- JWT Bearer Token required for all endpoints
- Token issued by OAuth2 server after user login
- Token expiry: 1 hour (refresh token valid for 7 days)

### Authorization (Role-Based Access Control)

| **Endpoint** | **Required Roles** |
|-------------|-------------------|
| `POST /api/workflow/pr/start` | `BUYER` |
| `GET /api/workflow/pr/{prId}` | `BUYER`, `APPROVER`, `MANAGER`, `FINANCE` |
| `POST /api/workflow/pr/{prId}/approve` | `APPROVER`, `MANAGER`, `MD` |
| `POST /api/workflow/tender/start` | `BUYER`, `TENDER_COMMITTEE` |
| `POST /api/workflow/tender/{tenderId}/evaluate` | `EVAL_COMMITTEE` |
| `POST /api/workflow/tender/{tenderId}/award` | `EVAL_COMMITTEE`, `CFO` |
| `POST /api/workflow/exception/{exceptionId}/resolve` | `MANAGER`, `CVO`, `MD` |

---

## Performance Considerations

### Caching
- Cache PR status for 30 seconds (Redis) to reduce database load
- Cache workflow definitions (BPMN XML) in memory

### Async Processing
- Tender publication (CPPP, GeM, email) runs asynchronously in parallel threads
- Bid evaluation (OCR, ML scoring) processes 95 bids in parallel (thread pool size: 10)

### Rate Limiting
- 100 requests/minute per user
- 1000 requests/minute per organization

---

**Document Version**: 1.0  
**Last Updated**: May 2025  
**Owner**: HPCL Digital Transformation Team
