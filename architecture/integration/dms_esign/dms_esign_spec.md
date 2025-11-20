# Document Management System & eSign Integration Specification
## HPCL Procurement Automation System

**Document Version**: 1.0  
**Last Updated**: 2025-11-21  
**Owner**: Integration Team  
**Status**: Draft  

---

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Document Management System (DMS)](#document-management-system-dms)
3. [Digital Signature (eSign) Integration](#digital-signature-esign-integration)
4. [Document Lifecycle Management](#document-lifecycle-management)
5. [Security & Compliance](#security--compliance)
6. [Testing Strategy](#testing-strategy)
7. [Rollout Plan](#rollout-plan)

---

## Integration Overview

### Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Document Storage** | 99.9% availability | Uptime SLA |
| **Version Control** | 100% documents versioned | Audit compliance |
| **Digital Signature** | 100% legal compliance | CCA/IT Act validation |
| **Audit Trail** | Tamper-evident logs | Checksum verification |

### Integration Architecture

```
┌─────────────────────┐
│  Procurement API    │
│  (Spring Boot)      │
└──────────┬──────────┘
           │
           ├────────────────────┐
           │                    │
           ▼                    ▼
  ┌────────────────┐   ┌────────────────┐
  │ DMS Adapter    │   │ eSign Adapter  │
  │ (S3/MinIO)     │   │ (eMudhra/Sify) │
  └────────┬───────┘   └────────┬───────┘
           │                    │
           ▼                    ▼
  ┌────────────────┐   ┌────────────────┐
  │ S3/MinIO       │   │ DSC Provider   │
  │ (Object Store) │   │ (eMudhra API)  │
  └────────────────┘   └────────────────┘
```

---

## Document Management System (DMS)

### DMS Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **AWS S3** | Scalable, 99.99% durability, lifecycle policies | Vendor lock-in, egress costs | ✅ Recommended for cloud |
| **MinIO** | On-premise, S3-compatible, cost-effective | Self-managed, requires infra | ✅ Recommended for on-prem |
| **SharePoint** | Integration with MS Office, familiar UI | Complex API, licensing costs | ❌ Not recommended |
| **Alfresco** | Open-source, workflow integration | Complex setup, limited cloud support | ❌ Not recommended |

**Decision**: Use **AWS S3** for cloud deployment, **MinIO** for on-premise deployment.

---

### S3 Bucket Structure

```
hpcl-procurement-documents/
├── purchase-requests/
│   ├── 2025/
│   │   ├── 11/
│   │   │   ├── PR-2025-001/
│   │   │   │   ├── v1_requisition.pdf
│   │   │   │   ├── v1_technical-specs.xlsx
│   │   │   │   ├── v2_requisition.pdf (revised)
│   │   │   │   └── signatures/
│   │   │   │       ├── l1-approval.p7s
│   │   │   │       └── l2-approval.p7s
│   │   │   └── PR-2025-002/
│   │   └── 12/
│   └── 2026/
├── purchase-orders/
│   ├── 2025/
│   │   ├── 11/
│   │   │   └── PO-2025-001/
│   │   │       ├── purchase-order.pdf
│   │   │       └── signatures/
│   │   │           └── authorized-signatory.p7s
│   └── 2026/
├── goods-receipt-notes/
└── invoices/
```

---

### S3 API Operations

#### 1. Upload Document

```java
@Service
public class S3DocumentService {
    
    @Autowired
    private AmazonS3 s3Client;
    
    @Value("${aws.s3.bucket}")
    private String bucketName;
    
    public DocumentMetadata uploadDocument(
        String prNumber,
        MultipartFile file,
        String documentType
    ) throws IOException {
        
        // Generate S3 key
        String s3Key = generateS3Key(prNumber, file.getOriginalFilename());
        
        // Calculate checksum
        String checksum = calculateSHA256(file.getInputStream());
        
        // Upload to S3
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());
        metadata.addUserMetadata("checksum-sha256", checksum);
        metadata.addUserMetadata("document-type", documentType);
        metadata.addUserMetadata("uploaded-by", SecurityContextHolder.getContext().getAuthentication().getName());
        metadata.addUserMetadata("upload-timestamp", Instant.now().toString());
        
        PutObjectRequest putRequest = new PutObjectRequest(
            bucketName,
            s3Key,
            file.getInputStream(),
            metadata
        );
        
        // Enable server-side encryption
        putRequest.withSSEAwsKeyManagementParams(
            new SSEAwsKeyManagementParams("arn:aws:kms:region:account-id:key/key-id")
        );
        
        s3Client.putObject(putRequest);
        
        // Save metadata to database
        DocumentMetadata docMetadata = new DocumentMetadata();
        docMetadata.setPrNumber(prNumber);
        docMetadata.setS3Key(s3Key);
        docMetadata.setFileName(file.getOriginalFilename());
        docMetadata.setFileSize(file.getSize());
        docMetadata.setChecksum(checksum);
        docMetadata.setDocumentType(documentType);
        docMetadata.setVersionNumber(1);
        docMetadata.setIsLatest(true);
        docMetadata.setUploadedAt(Instant.now());
        
        return documentMetadataRepository.save(docMetadata);
    }
    
    private String generateS3Key(String prNumber, String filename) {
        LocalDate now = LocalDate.now();
        return String.format(
            "purchase-requests/%d/%02d/%s/v1_%s",
            now.getYear(),
            now.getMonthValue(),
            prNumber,
            filename
        );
    }
    
    private String calculateSHA256(InputStream inputStream) throws IOException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            digest.update(buffer, 0, bytesRead);
        }
        return Base64.getEncoder().encodeToString(digest.digest());
    }
}
```

#### 2. Download Document

```java
public byte[] downloadDocument(Long documentId) {
    DocumentMetadata metadata = documentMetadataRepository.findById(documentId)
        .orElseThrow(() -> new DocumentNotFoundException(documentId));
    
    S3Object s3Object = s3Client.getObject(bucketName, metadata.getS3Key());
    
    try (InputStream inputStream = s3Object.getObjectContent()) {
        byte[] content = inputStream.readAllBytes();
        
        // Verify checksum
        String downloadedChecksum = calculateSHA256(new ByteArrayInputStream(content));
        if (!downloadedChecksum.equals(metadata.getChecksum())) {
            // CRITICAL: Document tampered!
            securityIncidentService.createIncident(
                "DOCUMENT_TAMPER_DETECTED",
                "Checksum mismatch for document: " + documentId
            );
            throw new DocumentTamperedException(documentId);
        }
        
        // Log audit event
        auditLogService.log(
            "DOCUMENT_DOWNLOADED",
            documentId,
            "User: " + SecurityContextHolder.getContext().getAuthentication().getName()
        );
        
        return content;
    }
}
```

#### 3. Version Control

```java
public DocumentMetadata uploadNewVersion(
    Long previousVersionId,
    MultipartFile newFile
) throws IOException {
    
    DocumentMetadata previousVersion = documentMetadataRepository.findById(previousVersionId)
        .orElseThrow(() -> new DocumentNotFoundException(previousVersionId));
    
    // Mark previous version as not latest
    previousVersion.setIsLatest(false);
    documentMetadataRepository.save(previousVersion);
    
    // Generate new version S3 key
    String newS3Key = previousVersion.getS3Key().replaceFirst(
        "v\\d+_",
        "v" + (previousVersion.getVersionNumber() + 1) + "_"
    );
    
    // Upload new version (similar to uploadDocument)
    // ...
    
    DocumentMetadata newVersion = new DocumentMetadata();
    newVersion.setPrNumber(previousVersion.getPrNumber());
    newVersion.setS3Key(newS3Key);
    newVersion.setFileName(newFile.getOriginalFilename());
    newVersion.setVersionNumber(previousVersion.getVersionNumber() + 1);
    newVersion.setIsLatest(true);
    newVersion.setPreviousVersionId(previousVersionId);
    
    return documentMetadataRepository.save(newVersion);
}
```

---

### S3 Lifecycle Policies

```json
{
  "Rules": [
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 2555
      },
      "Filter": {
        "Prefix": "purchase-requests/"
      }
    }
  ]
}
```

**Retention Policy**: 7 years (2555 days) as per PSU compliance.

---

## Digital Signature (eSign) Integration

### DSC Provider Options

| Provider | API Support | Compliance | Cost | Recommendation |
|----------|------------|------------|------|----------------|
| **eMudhra** | REST API, PKCS#11 | CCA-certified | Medium | ✅ Recommended |
| **Sify** | REST API | CCA-certified | Medium | ✅ Recommended |
| **nCode** | PKCS#11 only | CCA-certified | Low | ❌ Limited API |

**Decision**: Use **eMudhra** as primary, **Sify** as fallback.

---

### Legal Framework

- **Indian IT Act 2000**: Digital signatures have same legal validity as handwritten signatures
- **CCA (Controller of Certifying Authorities)**: Regulates DSC providers in India
- **DSC Classes**:
  - **Class 2**: For individuals (Approvers)
  - **Class 3**: For organizations (Authorized Signatories for POs)

---

### DSC Signing Workflow

#### 1. Approver Signs PR (Class 2 DSC)

```
User (Approver) → Frontend → API → eSign Adapter → eMudhra API
                                      ↓
                                  Sign Document
                                      ↓
                                Return Signature
                                      ↓
                          Store in attachments table
                                      ↓
                          Log in audit_log
```

#### 2. PO Issuance Signature (Class 3 DSC)

```
Workflow Engine → API → eSign Adapter → eMudhra API
                            ↓
                    Sign PO Document
                            ↓
                    Upload to S3 (signatures/)
                            ↓
                    Update PO status = "SIGNED"
```

---

### eMudhra API Integration

#### 1. Sign Document (PKCS#7 Detached Signature)

```http
POST https://api.emudhra.com/v1/sign
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "documentHash": "SHA256:abcdef123456...",
  "certificateSerial": "HPCL-DSC-APPROVER-001",
  "signatureFormat": "PKCS7_DETACHED",
  "timestampRequired": true,
  "reason": "PR Approval - Level 1",
  "location": "Mumbai, India",
  "contactInfo": "approver@hpcl.com"
}

Response (200 OK):
{
  "signatureId": "SIG-2025-001",
  "signatureData": "MIIGhgYJKoZIhvcNAQcCoIIGdzCCBnMCAQExDz...",
  "timestamp": "2025-11-21T14:30:00+05:30",
  "certificateChain": [
    "MIID...", // Signer cert
    "MIIE..."  // Intermediate CA cert
  ],
  "validUntil": "2026-11-21T14:30:00+05:30"
}
```

#### 2. Verify Signature

```http
POST https://api.emudhra.com/v1/verify
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "documentHash": "SHA256:abcdef123456...",
  "signatureData": "MIIGhgYJKoZIhvcNAQcCoIIGdzCCBnMCAQExDz..."
}

Response (200 OK):
{
  "valid": true,
  "signerName": "John Doe",
  "signerEmail": "john.doe@hpcl.com",
  "signedAt": "2025-11-21T14:30:00+05:30",
  "certificateStatus": "VALID",
  "certificateNotBefore": "2025-01-01T00:00:00+05:30",
  "certificateNotAfter": "2026-12-31T23:59:59+05:30",
  "revocationStatus": "NOT_REVOKED"
}
```

---

### Java Code: eSign Service

```java
@Service
public class ESignService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${emudhra.api.url}")
    private String eMudhraApiUrl;
    
    @Value("${emudhra.api.key}")
    private String apiKey;
    
    public SignatureResponse signDocument(
        String documentHash,
        String certificateSerial,
        String reason
    ) {
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> request = Map.of(
            "documentHash", documentHash,
            "certificateSerial", certificateSerial,
            "signatureFormat", "PKCS7_DETACHED",
            "timestampRequired", true,
            "reason", reason,
            "location", "Mumbai, India"
        );
        
        ResponseEntity<SignatureResponse> response = restTemplate.postForEntity(
            eMudhraApiUrl + "/v1/sign",
            new HttpEntity<>(request, headers),
            SignatureResponse.class
        );
        
        if (response.getStatusCode() != HttpStatus.OK) {
            throw new ESignException("Failed to sign document: " + response.getStatusCode());
        }
        
        SignatureResponse signatureResponse = response.getBody();
        
        // Store signature in database
        Signature signature = new Signature();
        signature.setSignatureId(signatureResponse.getSignatureId());
        signature.setSignatureData(signatureResponse.getSignatureData());
        signature.setDocumentHash(documentHash);
        signature.setCertificateSerial(certificateSerial);
        signature.setSignedAt(Instant.parse(signatureResponse.getTimestamp()));
        signature.setReason(reason);
        
        signatureRepository.save(signature);
        
        // Log audit event
        auditLogService.log(
            "DOCUMENT_SIGNED",
            documentHash,
            "Certificate: " + certificateSerial + ", Reason: " + reason
        );
        
        return signatureResponse;
    }
    
    public boolean verifySignature(String documentHash, String signatureData) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, String> request = Map.of(
            "documentHash", documentHash,
            "signatureData", signatureData
        );
        
        ResponseEntity<VerifyResponse> response = restTemplate.postForEntity(
            eMudhraApiUrl + "/v1/verify",
            new HttpEntity<>(request, headers),
            VerifyResponse.class
        );
        
        VerifyResponse verifyResponse = response.getBody();
        
        if (!verifyResponse.isValid()) {
            log.warn("Invalid signature for document: {}", documentHash);
            return false;
        }
        
        // Check certificate revocation
        if ("REVOKED".equals(verifyResponse.getRevocationStatus())) {
            log.error("Certificate revoked for document: {}", documentHash);
            securityIncidentService.createIncident(
                "REVOKED_CERTIFICATE_USED",
                "Document: " + documentHash
            );
            return false;
        }
        
        return true;
    }
}
```

---

### Signing Authority Matrix

| Document Type | Signer Role | DSC Class | Signature Type |
|--------------|-------------|-----------|----------------|
| PR Approval (L1) | Approver L1 | Class 2 | PKCS#7 Detached |
| PR Approval (L2) | Approver L2 | Class 2 | PKCS#7 Detached |
| PO Issuance | Authorized Signatory | Class 3 | PKCS#7 Detached |
| Contract Amendment | Legal Head | Class 3 | PKCS#7 Detached |

---

## Document Lifecycle Management

### Document States

```
UPLOADED → PENDING_OCR → OCR_COMPLETE → VALIDATED → APPROVED → SIGNED → ARCHIVED
```

### State Transitions

| From State | To State | Trigger | Action |
|-----------|----------|---------|--------|
| UPLOADED | PENDING_OCR | Async job | Queue OCR task |
| PENDING_OCR | OCR_COMPLETE | OCR success | Store extracted data |
| OCR_COMPLETE | VALIDATED | Manual review | Business rule validation |
| VALIDATED | APPROVED | Approver action | Create approval record |
| APPROVED | SIGNED | eSign API | Store signature in S3 |
| SIGNED | ARCHIVED | 1 year elapsed | Move to Glacier storage |

---

### Database Schema: Attachments & Signatures

```sql
CREATE TABLE attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pr_id BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- REQUISITION, TECHNICAL_SPEC, QUOTATION
    version_number INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    previous_version_id BIGINT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (previous_version_id) REFERENCES attachments(id),
    UNIQUE KEY uk_s3_key (s3_key)
);

CREATE TABLE signatures (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachment_id BIGINT NULL, -- For document signatures
    pr_id BIGINT NULL, -- For PR approval signatures
    po_id BIGINT NULL, -- For PO issuance signatures
    signature_id VARCHAR(100) NOT NULL UNIQUE, -- From eMudhra
    signature_data TEXT NOT NULL, -- PKCS#7 signature
    document_hash VARCHAR(64) NOT NULL, -- SHA-256 of signed document
    certificate_serial VARCHAR(100) NOT NULL,
    signer_name VARCHAR(200) NOT NULL,
    signer_email VARCHAR(200) NOT NULL,
    signature_reason VARCHAR(500) NOT NULL,
    signed_at TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    revocation_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REVOKED', -- NOT_REVOKED, REVOKED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attachment_id) REFERENCES attachments(id),
    FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);
```

---

## Security & Compliance

### Encryption

| Layer | Encryption Method | Key Management |
|-------|------------------|----------------|
| **At Rest (S3)** | AES-256 (SSE-KMS) | AWS KMS (auto-rotation) |
| **In Transit** | TLS 1.3 | Certificate from CA |
| **Database** | AES-256 | MySQL Transparent Data Encryption |

### Access Control

- **S3 Bucket Policy**: Restrict access to application IAM role only
- **Pre-Signed URLs**: Generate time-limited URLs (1 hour expiry) for download
- **RBAC**: Only authorized roles can upload/download documents

```java
public String generatePresignedUrl(Long documentId) {
    DocumentMetadata metadata = documentMetadataRepository.findById(documentId)
        .orElseThrow(() -> new DocumentNotFoundException(documentId));
    
    // Check user permission
    if (!hasPermission(metadata.getPrId(), "READ_DOCUMENTS")) {
        throw new AccessDeniedException("User not authorized to access document");
    }
    
    Date expiration = Date.from(Instant.now().plus(1, ChronoUnit.HOURS));
    
    GeneratePresignedUrlRequest urlRequest = new GeneratePresignedUrlRequest(
        bucketName,
        metadata.getS3Key()
    ).withMethod(HttpMethod.GET)
     .withExpiration(expiration);
    
    URL url = s3Client.generatePresignedUrl(urlRequest);
    
    // Log audit event
    auditLogService.log(
        "PRESIGNED_URL_GENERATED",
        documentId,
        "Expires at: " + expiration
    );
    
    return url.toString();
}
```

### Audit Requirements

Every document operation must be logged:

```sql
INSERT INTO audit_log (
    event_type,
    resource_type,
    resource_id,
    user_id,
    action,
    old_value,
    new_value,
    ip_address,
    timestamp
) VALUES (
    'DOCUMENT_UPLOADED',
    'ATTACHMENT',
    123,
    'user@hpcl.com',
    'CREATE',
    NULL,
    '{"file_name": "requisition.pdf", "checksum": "SHA256:..."}',
    '192.168.1.100',
    NOW()
);
```

---

## Testing Strategy

### Unit Tests

```java
@SpringBootTest
public class S3DocumentServiceTest {
    
    @Autowired
    private S3DocumentService s3DocumentService;
    
    @MockBean
    private AmazonS3 s3Client;
    
    @Test
    public void testUploadDocument_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            "Test content".getBytes()
        );
        
        DocumentMetadata result = s3DocumentService.uploadDocument("PR-2025-001", file, "REQUISITION");
        
        assertNotNull(result.getId());
        assertEquals("test.pdf", result.getFileName());
        verify(s3Client).putObject(any(PutObjectRequest.class));
    }
    
    @Test
    public void testDownloadDocument_ChecksumMismatch_ThrowsException() {
        // Mock document with tampered checksum
        DocumentMetadata metadata = new DocumentMetadata();
        metadata.setChecksum("original-checksum");
        
        when(documentMetadataRepository.findById(1L)).thenReturn(Optional.of(metadata));
        
        // Mock S3 object with different checksum
        // ...
        
        assertThrows(DocumentTamperedException.class, () -> {
            s3DocumentService.downloadDocument(1L);
        });
    }
}
```

### Integration Tests

| Test Scenario | Expected Result |
|--------------|-----------------|
| Upload 10MB PDF to S3 | Document stored, checksum verified |
| Download document and verify checksum | Checksum matches, no tampering |
| Upload new version of document | Version number incremented, previous version marked as not latest |
| Sign document with eMudhra API | Signature returned, stored in database |
| Verify signature with revoked certificate | Verification fails, security incident created |
| Generate pre-signed URL and download | URL expires after 1 hour |

---

## Rollout Plan

### Phase 1: S3 Setup (Week 4)
- Create S3 bucket with encryption
- Configure lifecycle policies
- Set up IAM roles and policies
- **Success Criteria**: Upload/download test files successfully

### Phase 2: DMS Integration (Week 5)
- Integrate S3 client with Spring Boot
- Implement upload/download APIs
- Add checksum verification
- **Success Criteria**: API tests pass, checksum validation works

### Phase 3: eSign Integration (Week 6)
- Obtain eMudhra API credentials
- Test sign/verify APIs in sandbox
- Implement signing workflow
- **Success Criteria**: Sign and verify 5 test documents successfully

### Phase 4: Production Pilot (Week 7-8)
- Upload 10% of documents to S3
- Sign PRs and POs with DSC
- Monitor error rates
- **Success Criteria**: >99% success rate, zero checksum mismatches

### Phase 5: Full Rollout (Week 9+)
- Migrate all documents to S3
- Enable eSign for all approvals
- **Success Criteria**: 100% documents signed digitally

---

## Acceptance Criteria

- [ ] S3 bucket created with KMS encryption
- [ ] Document upload/download APIs functional
- [ ] Checksum verification prevents tampered documents
- [ ] Version control tracks all document revisions
- [ ] eMudhra API integration working (sign + verify)
- [ ] Signature verification checks certificate revocation
- [ ] Audit logs capture all document operations
- [ ] Pre-signed URLs expire after 1 hour
- [ ] Integration tests pass on staging environment
- [ ] Security review approved (encryption, access control)

---

**Version History**:
- v1.0 (2025-11-21): Initial draft

**Reviewers**:
- [ ] Integration Team Lead
- [ ] Security Officer
- [ ] Legal Team (for DSC compliance)

**Next Steps**:
1. Request eMudhra API credentials
2. Set up S3 bucket in AWS account
3. Conduct legal review of DSC compliance
4. Develop upload/download APIs
