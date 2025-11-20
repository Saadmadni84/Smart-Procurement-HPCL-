# GeM & CPPP Integration Specification
## HPCL Procurement Automation System

**Document Version**: 1.0  
**Last Updated**: 2025-11-21  
**Owner**: Integration Team  
**Status**: Draft  

---

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [GeM (Government e-Marketplace) Integration](#gem-integration)
3. [CPPP (Central Public Procurement Portal) Integration](#cppp-integration)
4. [Data Mapping](#data-mapping)
5. [Authentication & Security](#authentication--security)
6. [Error Handling & Retry Logic](#error-handling--retry-logic)
7. [RPA Fallback Strategy](#rpa-fallback-strategy)
8. [Reconciliation & Audit](#reconciliation--audit)
9. [Testing Strategy](#testing-strategy)
10. [Rollout Plan](#rollout-plan)

---

## Integration Overview

### Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Automated Tender Publishing** | 90% of tenders auto-published | Success rate |
| **Bid Tracking** | Real-time bid updates | Sync latency < 5 minutes |
| **Compliance** | 100% CVC compliance | Audit pass rate |
| **Manual Effort Reduction** | 70% reduction in manual portal entry | Time saved |

### Integration Architecture

```
┌─────────────────────┐
│  Procurement API    │
│  (Spring Boot)      │
└──────────┬──────────┘
           │
           ├─────────────────┐
           │                 │
           ▼                 ▼
  ┌────────────────┐  ┌────────────────┐
  │ GeM Adapter    │  │ CPPP Adapter   │
  │ (REST/RPA)     │  │ (REST/RPA)     │
  └────────┬───────┘  └────────┬───────┘
           │                   │
           ▼                   ▼
  ┌────────────────┐  ┌────────────────┐
  │ GeM Portal     │  │ CPPP Portal    │
  │ (External)     │  │ (External)     │
  └────────────────┘  └────────────────┘
```

### Integration Modes

| Portal | Primary Method | Fallback | Trigger Condition |
|--------|---------------|----------|-------------------|
| **GeM** | REST API (if available) | RPA (UiPath) | API unavailable or rate-limited |
| **CPPP** | REST API (if available) | RPA (UiPath) | API unavailable or authentication failure |

---

## GeM Integration

### GeM Portal Overview

- **URL**: https://gem.gov.in
- **Purpose**: Centralized procurement platform for government organizations
- **Key Features**: Tender publishing, bid management, contract awards, vendor management
- **API Availability**: Limited public APIs (check with GeM team for access)

### GeM API Endpoints (Hypothetical - Verify with GeM Documentation)

#### 1. Authentication

```http
POST https://api.gem.gov.in/v1/auth/login
Content-Type: application/json

{
  "organizationId": "HPCL-12345",
  "apiKey": "YOUR_API_KEY",
  "apiSecret": "YOUR_API_SECRET"
}

Response:
{
  "accessToken": "eyJhbGciOiJSUzI1Ni...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

#### 2. Publish Tender

```http
POST https://api.gem.gov.in/v1/tenders
Authorization: Bearer {accessToken}
Content-Type: application/json
X-Idempotency-Key: {PR_ID}-{TIMESTAMP}

{
  "tenderReference": "HPCL/PR/2025/001",
  "title": "Supply of Industrial Chemicals",
  "description": "Procurement of 500 MT of Caustic Soda",
  "category": "CHEMICALS",
  "estimatedValue": 2500000.00,
  "currency": "INR",
  "bidOpeningDate": "2025-12-01T10:00:00+05:30",
  "bidClosingDate": "2025-11-25T17:00:00+05:30",
  "technicalSpecifications": [
    {
      "parameter": "Purity",
      "value": ">= 98%",
      "mandatory": true
    },
    {
      "parameter": "Packaging",
      "value": "HDPE drums, 200L",
      "mandatory": true
    }
  ],
  "deliveryTerms": {
    "location": "HPCL Refinery, Mumbai",
    "timeline": "Within 30 days from PO",
    "incoterm": "DDP"
  },
  "paymentTerms": "Net 60 days",
  "documents": [
    {
      "type": "TENDER_DOCUMENT",
      "url": "https://hpcl-dms.example.com/tenders/PR001.pdf"
    },
    {
      "type": "TECHNICAL_SPECS",
      "url": "https://hpcl-dms.example.com/tenders/PR001-specs.pdf"
    }
  ]
}

Response (201 Created):
{
  "tenderId": "GeM-TND-2025-123456",
  "status": "PUBLISHED",
  "publishedAt": "2025-11-21T14:30:00+05:30",
  "portalUrl": "https://gem.gov.in/tenders/GeM-TND-2025-123456",
  "_links": {
    "self": "/v1/tenders/GeM-TND-2025-123456",
    "bids": "/v1/tenders/GeM-TND-2025-123456/bids",
    "cancel": "/v1/tenders/GeM-TND-2025-123456/cancel"
  }
}
```

#### 3. Get Tender Status

```http
GET https://api.gem.gov.in/v1/tenders/{tenderId}
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "tenderId": "GeM-TND-2025-123456",
  "status": "ACTIVE",
  "bidCount": 5,
  "bidOpeningDate": "2025-12-01T10:00:00+05:30",
  "bidClosingDate": "2025-11-25T17:00:00+05:30",
  "lastUpdated": "2025-11-22T09:15:00+05:30"
}
```

#### 4. Fetch Bids

```http
GET https://api.gem.gov.in/v1/tenders/{tenderId}/bids
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "tenderId": "GeM-TND-2025-123456",
  "totalBids": 5,
  "bids": [
    {
      "bidId": "BID-001",
      "vendorId": "VENDOR-12345",
      "vendorName": "ABC Chemicals Ltd",
      "bidAmount": 2450000.00,
      "submittedAt": "2025-11-24T16:45:00+05:30",
      "technicalScore": 85,
      "financialScore": 92,
      "totalScore": 88.5,
      "status": "EVALUATED"
    },
    {
      "bidId": "BID-002",
      "vendorId": "VENDOR-67890",
      "vendorName": "XYZ Industries",
      "bidAmount": 2380000.00,
      "submittedAt": "2025-11-24T15:30:00+05:30",
      "technicalScore": 90,
      "financialScore": 95,
      "totalScore": 92.5,
      "status": "EVALUATED"
    }
  ]
}
```

#### 5. Award Tender

```http
POST https://api.gem.gov.in/v1/tenders/{tenderId}/award
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "bidId": "BID-002",
  "vendorId": "VENDOR-67890",
  "awardAmount": 2380000.00,
  "awardReason": "L1 bidder with highest technical score",
  "contractStartDate": "2025-12-05",
  "contractEndDate": "2026-01-05",
  "approvedBy": "John Doe (Approver L2)",
  "digitalSignature": {
    "signedHash": "SHA256:abcdef123456...",
    "certificateSerial": "DSC-HPCL-001",
    "timestamp": "2025-12-02T10:30:00+05:30"
  }
}

Response (200 OK):
{
  "awardId": "AWARD-2025-001",
  "status": "AWARDED",
  "awardedAt": "2025-12-02T10:30:15+05:30",
  "contractUrl": "https://gem.gov.in/contracts/AWARD-2025-001"
}
```

### GeM API Error Responses

#### Rate Limit Exceeded (429)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "API rate limit exceeded. Retry after 60 seconds.",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0,
  "resetAt": "2025-11-21T15:00:00+05:30"
}
```

#### Authentication Failed (401)

```json
{
  "error": "AUTHENTICATION_FAILED",
  "message": "Invalid API credentials",
  "timestamp": "2025-11-21T14:30:00+05:30"
}
```

#### Tender Not Found (404)

```json
{
  "error": "TENDER_NOT_FOUND",
  "message": "Tender with ID GeM-TND-2025-999999 not found",
  "timestamp": "2025-11-21T14:30:00+05:30"
}
```

---

## CPPP Integration

### CPPP Portal Overview

- **URL**: https://eprocure.gov.in/cppp
- **Purpose**: Central Public Procurement Portal for transparency and e-tendering
- **Key Features**: Tender notification, bid submission, corrigendum publishing
- **API Availability**: Limited (primarily web-based portal)

### CPPP API Endpoints (Hypothetical)

#### 1. Publish Tender Notification

```http
POST https://api.cppp.gov.in/v1/tenders/publish
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "organizationName": "Hindustan Petroleum Corporation Limited",
  "tenderNumber": "HPCL/PR/2025/001",
  "tenderTitle": "Supply of Industrial Chemicals",
  "tenderCategory": "GOODS",
  "estimatedCost": 2500000.00,
  "earnestMoneyDeposit": 50000.00,
  "publicationDate": "2025-11-21",
  "bidSubmissionStartDate": "2025-11-22",
  "bidSubmissionEndDate": "2025-11-25",
  "bidOpeningDate": "2025-12-01",
  "tenderDocumentUrl": "https://hpcl-dms.example.com/tenders/PR001.pdf",
  "contactPerson": {
    "name": "Procurement Officer",
    "email": "procurement@hpcl.com",
    "phone": "+91-22-12345678"
  }
}

Response (201 Created):
{
  "cpppReferenceId": "CPPP-2025-TN-123456",
  "status": "PUBLISHED",
  "publishedAt": "2025-11-21T14:30:00+05:30",
  "publicUrl": "https://eprocure.gov.in/cppp/tenders/CPPP-2025-TN-123456"
}
```

#### 2. Publish Corrigendum

```http
POST https://api.cppp.gov.in/v1/tenders/{cpppReferenceId}/corrigendum
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "corrigendumNumber": "CORR-001",
  "changes": [
    {
      "field": "Bid Closing Date",
      "oldValue": "2025-11-25",
      "newValue": "2025-11-28",
      "reason": "Extension due to technical clarifications"
    }
  ],
  "notificationDate": "2025-11-23"
}

Response (200 OK):
{
  "corrigendumId": "CPPP-CORR-001",
  "status": "PUBLISHED",
  "publishedAt": "2025-11-23T10:00:00+05:30"
}
```

---

## Data Mapping

### PR to GeM Tender Mapping

| Procurement Field | GeM API Field | Mandatory | Transformation |
|------------------|---------------|-----------|----------------|
| `pr_number` | `tenderReference` | Yes | Direct mapping |
| `description` | `title` | Yes | Truncate to 200 chars |
| `detailed_description` | `description` | Yes | Direct mapping |
| `category` | `category` | Yes | Map to GeM category codes |
| `estimated_budget` | `estimatedValue` | Yes | Direct mapping |
| `required_date` | `bidOpeningDate` | Yes | Format: ISO 8601 |
| `pr_items[].specification` | `technicalSpecifications[]` | Yes | Parse into parameter-value pairs |
| `delivery_location` | `deliveryTerms.location` | Yes | Direct mapping |
| `payment_terms` | `paymentTerms` | No | Default: "Net 60 days" |

### Category Code Mapping

| Internal Category | GeM Category Code |
|------------------|-------------------|
| `CHEMICALS` | `CAT-CHEM-001` |
| `STATIONERY` | `CAT-STAT-002` |
| `IT_HARDWARE` | `CAT-IT-003` |
| `MACHINERY` | `CAT-MACH-004` |
| `SERVICES` | `CAT-SERV-005` |

---

## Authentication & Security

### GeM Authentication

**Method**: OAuth 2.0 Client Credentials Flow

```java
@Service
public class GeMAuthService {
    
    @Value("${gem.api.base-url}")
    private String gemApiUrl;
    
    @Value("${gem.api.organization-id}")
    private String organizationId;
    
    @Value("${gem.api.key}")
    private String apiKey;
    
    @Value("${gem.api.secret}")
    private String apiSecret;
    
    private String accessToken;
    private Instant tokenExpiry;
    
    public String getAccessToken() {
        if (accessToken == null || Instant.now().isAfter(tokenExpiry)) {
            refreshAccessToken();
        }
        return accessToken;
    }
    
    private void refreshAccessToken() {
        RestTemplate restTemplate = new RestTemplate();
        
        Map<String, String> request = Map.of(
            "organizationId", organizationId,
            "apiKey", apiKey,
            "apiSecret", apiSecret
        );
        
        ResponseEntity<GeMAuthResponse> response = restTemplate.postForEntity(
            gemApiUrl + "/v1/auth/login",
            request,
            GeMAuthResponse.class
        );
        
        if (response.getStatusCode() == HttpStatus.OK) {
            GeMAuthResponse authResponse = response.getBody();
            this.accessToken = authResponse.getAccessToken();
            this.tokenExpiry = Instant.now().plusSeconds(authResponse.getExpiresIn() - 300); // 5 min buffer
        } else {
            throw new GeMAuthenticationException("Failed to authenticate with GeM API");
        }
    }
}
```

### CPPP Authentication

**Method**: API Key in Header

```java
@Service
public class CPPPAuthService {
    
    @Value("${cppp.api.key}")
    private String cpppApiKey;
    
    public HttpHeaders getCPPPHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + cpppApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
```

### Secrets Management

- Store API keys in **HashiCorp Vault** or **AWS Secrets Manager**
- Rotate secrets every 90 days
- Use environment-specific credentials (dev, staging, prod)

---

## Error Handling & Retry Logic

### Error Classification

| Error Type | HTTP Status | Retry Strategy | Action |
|-----------|-------------|----------------|--------|
| **Rate Limit Exceeded** | 429 | Exponential backoff | Wait `retryAfter` seconds, then retry |
| **Authentication Failed** | 401 | Refresh token | Refresh access token, retry once |
| **Validation Error** | 400 | No retry | Log error, create exception record |
| **Tender Not Found** | 404 | No retry | Log error, notify admin |
| **Server Error** | 500, 502, 503 | Exponential backoff | Retry up to 3 times |
| **Gateway Timeout** | 504 | Linear backoff | Retry up to 2 times |

### Retry Configuration (Spring Retry)

```java
@Configuration
@EnableRetry
public class GeMRetryConfig {
    
    @Bean
    public RetryTemplate geMRetryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();
        
        // Exponential backoff: 5s, 10s, 20s
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(5000);
        backOffPolicy.setMultiplier(2.0);
        backOffPolicy.setMaxInterval(20000);
        retryTemplate.setBackOffPolicy(backOffPolicy);
        
        // Retry on specific exceptions
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        retryTemplate.setRetryPolicy(retryPolicy);
        
        return retryTemplate;
    }
}

@Service
public class GeMTenderService {
    
    @Autowired
    private RetryTemplate geMRetryTemplate;
    
    @Retryable(
        value = {GeM RateLimitException.class, GeMServerException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 5000, multiplier = 2)
    )
    public GeMTenderResponse publishTender(PurchaseRequest pr) {
        // API call logic
    }
    
    @Recover
    public GeMTenderResponse recoverFromGeMFailure(GeMRateLimitException e, PurchaseRequest pr) {
        log.error("GeM API failed after retries for PR: {}", pr.getId(), e);
        
        // Fallback to RPA
        return rpaFallbackService.publishTenderViaRPA(pr);
    }
}
```

---

## RPA Fallback Strategy

### When to Use RPA

1. **API Unavailable**: GeM/CPPP API is down or inaccessible
2. **Rate Limit Exhausted**: API rate limits exceeded and retry delay > 5 minutes
3. **Authentication Issues**: API credentials expired and unable to refresh
4. **Portal-Only Features**: Functionality not available via API

### RPA Tool: UiPath

#### RPA Workflow: Publish Tender to GeM

```
1. Launch Browser (Chrome)
2. Navigate to https://gem.gov.in
3. Enter credentials (from Vault)
4. Click Login
5. Navigate to "Publish Tender" page
6. Fill form fields:
   - Tender Title: {pr.description}
   - Category: {pr.category}
   - Estimated Value: {pr.estimated_budget}
   - Bid Opening Date: {pr.required_date}
7. Upload tender document (download from DMS first)
8. Click "Publish"
9. Wait for confirmation page
10. Extract Tender ID from confirmation message
11. Take screenshot for audit
12. Close browser
13. Return Tender ID to system
```

#### UiPath Orchestrator Integration

```java
@Service
public class UiPathOrchestratorService {
    
    @Value("${uipath.orchestrator.url}")
    private String orchestratorUrl;
    
    @Value("${uipath.api.key}")
    private String apiKey;
    
    public String triggerGeMPublishJob(PurchaseRequest pr) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-UIPATH-TenantName", "HPCL");
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> jobRequest = Map.of(
            "startInfo", Map.of(
                "ReleaseKey", "GeM_Tender_Publish_v1.0",
                "Strategy", "Specific",
                "RobotIds", List.of(1),
                "InputArguments", "{ \"pr_number\": \"" + pr.getPrNumber() + "\" }"
            )
        );
        
        ResponseEntity<Map> response = restTemplate.postForEntity(
            orchestratorUrl + "/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs",
            new HttpEntity<>(jobRequest, headers),
            Map.class
        );
        
        String jobId = (String) response.getBody().get("Id");
        return jobId;
    }
    
    public GeMTenderResponse pollJobResult(String jobId) {
        // Poll UiPath Orchestrator for job completion
        // Extract output arguments (Tender ID, screenshot URL)
    }
}
```

#### RPA Error Handling

| Error | Action |
|-------|--------|
| **CAPTCHA Detected** | Send notification to admin, manual intervention required |
| **Session Timeout** | Retry login, resume from last checkpoint |
| **Element Not Found** | Take screenshot, log error, mark as failed |
| **Network Disconnection** | Retry after 30 seconds |

---

## Reconciliation & Audit

### Daily Reconciliation Job

```java
@Scheduled(cron = "0 0 2 * * *") // 2 AM daily
public void reconcileGeMTenders() {
    List<PurchaseRequest> publishedPRs = prRepository.findByStatus("PUBLISHED_TO_GEM");
    
    for (PurchaseRequest pr : publishedPRs) {
        try {
            GeMTenderResponse gemTender = geMTenderService.getTenderStatus(pr.getGemTenderId());
            
            if (!gemTender.getStatus().equals(pr.getGemStatus())) {
                log.warn("Status mismatch for PR {}: Local={}, GeM={}", 
                    pr.getId(), pr.getGemStatus(), gemTender.getStatus());
                
                // Update local status
                pr.setGemStatus(gemTender.getStatus());
                pr.setLastSyncedAt(Instant.now());
                prRepository.save(pr);
                
                // Log audit event
                auditLogService.log(
                    "GEM_STATUS_SYNC",
                    pr.getId(),
                    pr.getGemStatus() + " -> " + gemTender.getStatus()
                );
            }
        } catch (Exception e) {
            log.error("Reconciliation failed for PR {}", pr.getId(), e);
        }
    }
}
```

### Audit Trail

Every GeM/CPPP interaction must be logged:

```sql
INSERT INTO integration_logs (
    integration_type,
    request_id,
    pr_id,
    endpoint,
    request_payload,
    response_payload,
    http_status,
    success,
    error_message,
    created_at
) VALUES (
    'GEM',
    'REQ-123',
    1,
    'POST /v1/tenders',
    '{"tenderReference": "HPCL/PR/2025/001"}',
    '{"tenderId": "GeM-TND-2025-123456"}',
    201,
    true,
    NULL,
    NOW()
);
```

---

## Testing Strategy

### Unit Tests

```java
@SpringBootTest
public class GeMTenderServiceTest {
    
    @Autowired
    private GeMTenderService geMTenderService;
    
    @MockBean
    private RestTemplate restTemplate;
    
    @Test
    public void testPublishTender_Success() {
        PurchaseRequest pr = createSamplePR();
        
        GeMTenderResponse mockResponse = new GeMTenderResponse();
        mockResponse.setTenderId("GeM-TND-TEST-001");
        mockResponse.setStatus("PUBLISHED");
        
        when(restTemplate.postForEntity(anyString(), any(), eq(GeMTenderResponse.class)))
            .thenReturn(ResponseEntity.ok(mockResponse));
        
        GeMTenderResponse result = geMTenderService.publishTender(pr);
        
        assertEquals("GeM-TND-TEST-001", result.getTenderId());
        assertEquals("PUBLISHED", result.getStatus());
    }
    
    @Test
    public void testPublishTender_RateLimitExceeded_Retry() {
        PurchaseRequest pr = createSamplePR();
        
        // First call: 429 Rate Limit
        when(restTemplate.postForEntity(anyString(), any(), eq(GeMTenderResponse.class)))
            .thenThrow(new GeMRateLimitException("Rate limit exceeded"))
            .thenReturn(ResponseEntity.ok(new GeMTenderResponse()));
        
        GeMTenderResponse result = geMTenderService.publishTender(pr);
        
        verify(restTemplate, times(2)).postForEntity(anyString(), any(), eq(GeMTenderResponse.class));
    }
}
```

### Integration Tests (Staging Environment)

| Test Scenario | Expected Result |
|--------------|-----------------|
| Publish tender to GeM staging | Tender ID returned, status=PUBLISHED |
| Fetch bids from published tender | Bid list returned with vendor details |
| Award tender to L1 bidder | Award ID returned, status=AWARDED |
| Publish corrigendum to CPPP | Corrigendum ID returned, notification sent |
| Handle 429 rate limit | Retry after backoff, success on retry |
| Fallback to RPA on API failure | RPA job triggered, Tender ID extracted |

---

## Rollout Plan

### Phase 1: GeM Staging (Week 4)
- Set up GeM staging environment credentials
- Test API authentication
- Publish 5 test tenders
- Verify bid fetching and award flow
- **Success Criteria**: 5/5 tenders published successfully

### Phase 2: CPPP Staging (Week 5)
- Set up CPPP API credentials
- Test tender notification publishing
- Publish 3 test tenders
- **Success Criteria**: 3/3 tenders visible on CPPP portal

### Phase 3: RPA Fallback Setup (Week 6)
- Deploy UiPath bots on RPA server
- Configure Orchestrator queues
- Test RPA workflow with 2 tenders
- **Success Criteria**: RPA publishes tender successfully, screenshot captured

### Phase 4: Production Pilot (Week 7-8)
- Publish 10% of tenders via API
- Monitor error rates and retry success
- **Success Criteria**: >90% success rate, <5% fallback to RPA

### Phase 5: Full Rollout (Week 9+)
- Publish 100% of tenders automatically
- Enable daily reconciliation job
- **Success Criteria**: >95% success rate, manual intervention <2%

---

## Acceptance Criteria

- [ ] GeM API authentication working (OAuth 2.0)
- [ ] Tender publishing to GeM successful (>90% success rate)
- [ ] Bid fetching and tracking functional
- [ ] CPPP tender notification publishing successful
- [ ] RPA fallback triggers on API failure (<5s delay)
- [ ] Retry logic handles 429 rate limits correctly
- [ ] Daily reconciliation job runs without errors
- [ ] Audit logs capture all GeM/CPPP interactions
- [ ] Integration tests pass on staging environment
- [ ] Security review approved (API key storage in Vault)

---

**Version History**:
- v1.0 (2025-11-21): Initial draft

**Reviewers**:
- [ ] Integration Team Lead
- [ ] Procurement Owner
- [ ] Security Officer

**Next Steps**:
1. Request GeM API credentials from GeM team
2. Set up staging environment for testing
3. Develop RPA workflows in UiPath
4. Conduct security review of API key management
