# Document Intelligence Service Specification

## Overview
The Document Intelligence Service provides OCR (Optical Character Recognition), NLP (Natural Language Processing), and automated document validation for invoices, bids, certificates, and compliance documents.

---

## Technology Stack
- **OCR Engine**: Azure Document Intelligence (Form Recognizer) OR Tesseract OCR
- **NLP**: spaCy, Hugging Face Transformers
- **Framework**: Python 3.11 (FastAPI) for ML services, Spring Boot for integration
- **Storage**: AWS S3 / Azure Blob Storage for document storage
- **Database**: PostgreSQL (extracted data), MongoDB (raw OCR results)
- **Queue**: RabbitMQ (async document processing)

---

## Supported Document Types

### 1. Invoices
- **Fields Extracted**: Invoice number, date, vendor name, GSTIN, total amount, line items, HSN codes
- **Validation**: GST number format, invoice date reasonableness, amount matching with PO
- **Use Case**: Auto-verify invoices against POs, detect fraud (duplicate invoices, inflated amounts)

### 2. Purchase Orders
- **Fields Extracted**: PO number, vendor, line items, unit price, total value, delivery date
- **Validation**: PO exists in SAP, vendor code matches, amounts consistent
- **Use Case**: Three-way matching (PO + Invoice + Delivery Note)

### 3. Bids (Tender Responses)
- **Fields Extracted**: Bid ID, vendor name, total price, unit prices, delivery time, payment terms, GST, certifications
- **Validation**: Compliance with tender specs, mandatory fields present, price reasonableness
- **Use Case**: Automated bid evaluation, comparative analysis

### 4. Compliance Certificates
- **Fields Extracted**: Certificate type (ISO 9001, GST, PAN), issuing authority, validity dates, registration numbers
- **Validation**: Expiry date check, issuing authority legitimacy, registration number format
- **Use Case**: Vendor onboarding, bid compliance checks

### 5. CVC Forms
- **Fields Extracted**: Form type (Form 17, etc.), justification text, approver signatures, dates
- **Validation**: Required signatures present, justification meets word count, dates valid
- **Use Case**: CVC compliance automation

---

## API Endpoints

### 1. Extract Invoice Data

**Endpoint**: `POST /api/document/extract/invoice`

**Description**: Extracts structured data from invoice PDF/image

**Request**:
```http
POST /api/document/extract/invoice
Content-Type: multipart/form-data

file: [invoice.pdf]
poId: "PO-2025-05-001" (optional, for validation)
```

**Response** (200 OK):
```json
{
  "documentId": "DOC-2025-11-001",
  "documentType": "INVOICE",
  "extractedAt": "2025-11-20T10:30:00Z",
  "confidence": 0.96,
  "extractedFields": {
    "invoiceNumber": "INV-DELL-2025-5678",
    "invoiceDate": "2025-11-15",
    "vendorName": "Dell India Pvt Ltd",
    "vendorGSTIN": "27AABCU9603R1Z5",
    "vendorAddress": "Embassy Tech Village, Bangalore 560103",
    "totalAmount": 262500,
    "taxableAmount": 250000,
    "cgst": 6250,
    "sgst": 6250,
    "igst": 0,
    "currency": "INR",
    "paymentTerms": "Net 30",
    "poReference": "PO-2025-05-001",
    "lineItems": [
      {
        "itemNumber": 1,
        "description": "Dell Latitude 5540 Laptop",
        "hsnCode": "8471",
        "quantity": 5,
        "unitPrice": 50000,
        "totalPrice": 250000
      }
    ]
  },
  "validation": {
    "gstinValid": true,
    "gstinVerified": true,
    "dateReasonable": true,
    "poMatch": true,
    "amountMatch": true,
    "duplicateCheck": false,
    "issues": []
  },
  "rawOcrText": "INVOICE\nDell India Pvt Ltd\nGSTIN: 27AABCU9603R1Z5\n...",
  "confidence_scores": {
    "invoiceNumber": 0.99,
    "totalAmount": 0.98,
    "gstNumber": 0.97,
    "lineItems": 0.95
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "errorCode": "OCR_EXTRACTION_FAILED",
  "message": "Unable to extract invoice data. Document quality too low.",
  "suggestions": [
    "Ensure document is scanned at minimum 300 DPI",
    "Avoid blurry or angled images",
    "Remove handwritten annotations"
  ]
}
```

---

### 2. Extract Bid Data

**Endpoint**: `POST /api/document/extract/bid`

**Description**: Extracts commercial and technical data from tender bid documents

**Request**:
```http
POST /api/document/extract/bid
Content-Type: multipart/form-data

technicalBid: [technical_bid.pdf]
commercialBid: [commercial_bid.pdf]
tenderId: "TENDER-2025-05-001"
```

**Response** (200 OK):
```json
{
  "documentId": "DOC-BID-2025-11-050",
  "bidId": "BID-023",
  "tenderId": "TENDER-2025-05-001",
  "extractedAt": "2025-11-20T11:00:00Z",
  "technicalData": {
    "vendorName": "Dell India Pvt Ltd",
    "technicalSpecs": {
      "processor": "Intel Core i7 13th Gen",
      "ram": "16GB DDR4",
      "storage": "512GB NVMe SSD",
      "display": "15.6\" FHD",
      "os": "Windows 11 Pro",
      "warranty": "3 years onsite"
    },
    "certifications": [
      {
        "type": "ISO 9001:2015",
        "issuedBy": "TUV India",
        "validUntil": "2026-08-15",
        "verified": true
      },
      {
        "type": "BIS Certification",
        "number": "R-12345678",
        "verified": true
      }
    ],
    "complianceScore": 0.92,
    "nonCompliances": []
  },
  "commercialData": {
    "totalPrice": 4200000,
    "unitPrice": 50000,
    "quantity": 84,
    "deliveryTime": "45 days",
    "paymentTerms": "Net 30 from delivery",
    "warranty": "3 years comprehensive",
    "emdAmount": 50000,
    "emdBankGuarantee": "BG-HDFC-2025-1234",
    "gstNumber": "27AABCU9603R1Z5",
    "panNumber": "AABCU9603R",
    "priceBreakup": {
      "basePrice": 42000,
      "accessories": 5000,
      "warranty": 3000,
      "subtotal": 50000,
      "gst": 9000,
      "total": 59000
    }
  },
  "validation": {
    "technicalCompliance": true,
    "commercialCompliance": true,
    "emdVerified": true,
    "gstValid": true,
    "panValid": true,
    "certificatesValid": true,
    "issues": []
  },
  "confidence": 0.94
}
```

---

### 3. Verify Certificate

**Endpoint**: `POST /api/document/verify/certificate`

**Description**: Verifies compliance certificates (GST, ISO, PAN)

**Request Body**:
```json
{
  "certificateType": "GST",
  "gstNumber": "27AABCU9603R1Z5",
  "vendorName": "Dell India Pvt Ltd"
}
```

**Response** (200 OK):
```json
{
  "certificateType": "GST",
  "gstNumber": "27AABCU9603R1Z5",
  "verified": true,
  "verificationSource": "GSTN API",
  "vendorDetails": {
    "legalName": "Dell India Private Limited",
    "tradeName": "Dell India",
    "registrationDate": "2017-07-01",
    "status": "ACTIVE",
    "address": "Embassy Tech Village, Outer Ring Road, Bangalore 560103",
    "state": "Karnataka",
    "stateCode": "29"
  },
  "verifiedAt": "2025-11-20T12:00:00Z",
  "nameMatch": true,
  "nameMatchScore": 0.98
}
```

**Invalid GST Response**:
```json
{
  "certificateType": "GST",
  "gstNumber": "27AABCU9603R1Z9",
  "verified": false,
  "verificationSource": "GSTN API",
  "errorMessage": "GST number not found in GSTN database",
  "verifiedAt": "2025-11-20T12:00:00Z"
}
```

---

### 4. Detect Duplicate Invoice

**Endpoint**: `POST /api/document/detect-duplicate`

**Description**: Checks if invoice is duplicate (fraud detection)

**Request Body**:
```json
{
  "invoiceNumber": "INV-DELL-2025-5678",
  "vendorCode": "VENDOR-DELL-001",
  "totalAmount": 262500,
  "invoiceDate": "2025-11-15"
}
```

**Response** (200 OK - No Duplicate):
```json
{
  "duplicate": false,
  "message": "No duplicate invoice found"
}
```

**Duplicate Detected Response**:
```json
{
  "duplicate": true,
  "duplicateInvoiceId": "INV-2025-10-450",
  "matchedFields": ["invoiceNumber", "vendorCode", "totalAmount"],
  "previousSubmissionDate": "2025-11-10T14:30:00Z",
  "previousPoId": "PO-2025-04-999",
  "similarity": 0.99,
  "recommendation": "REJECT - Exact duplicate detected",
  "alertSent": true
}
```

---

### 5. Compare Documents (Three-Way Matching)

**Endpoint**: `POST /api/document/compare/three-way-match`

**Description**: Compares PO, Invoice, and Delivery Note for consistency

**Request Body**:
```json
{
  "poId": "PO-2025-05-001",
  "invoiceDocumentId": "DOC-2025-11-001",
  "deliveryNoteDocumentId": "DOC-2025-11-055"
}
```

**Response** (200 OK):
```json
{
  "matchStatus": "PARTIAL_MATCH",
  "overallScore": 0.94,
  "matches": {
    "vendor": {
      "match": true,
      "poValue": "Dell India",
      "invoiceValue": "Dell India Pvt Ltd",
      "deliveryValue": "Dell India",
      "score": 0.98
    },
    "totalAmount": {
      "match": true,
      "poValue": 250000,
      "invoiceValue": 250000,
      "deliveryValue": 250000,
      "score": 1.0
    },
    "quantity": {
      "match": true,
      "poValue": 5,
      "invoiceValue": 5,
      "deliveryValue": 5,
      "score": 1.0
    },
    "deliveryDate": {
      "match": false,
      "poValue": "2025-06-15",
      "deliveryValue": "2025-06-18",
      "deviation": "3 days late",
      "score": 0.85
    }
  },
  "discrepancies": [
    {
      "field": "deliveryDate",
      "severity": "LOW",
      "description": "Delivery 3 days late (PO: 2025-06-15, Actual: 2025-06-18)",
      "recommendation": "Acceptable delay, verify vendor justification"
    }
  ],
  "recommendation": "APPROVE_WITH_NOTES"
}
```

---

## Service Implementation (Python FastAPI)

### OCR Extraction Service

```python
from fastapi import FastAPI, UploadFile, File
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
import requests

app = FastAPI()

# Azure Document Intelligence client
document_client = DocumentAnalysisClient(
    endpoint="https://hpcl-doc-intelligence.cognitiveservices.azure.com/",
    credential=AzureKeyCredential(os.getenv("AZURE_DOC_KEY"))
)

@app.post("/api/document/extract/invoice")
async def extract_invoice(file: UploadFile = File(...), poId: str = None):
    try:
        # 1. Read uploaded file
        file_bytes = await file.read()
        
        # 2. Call Azure Document Intelligence
        poller = document_client.begin_analyze_document(
            "prebuilt-invoice", file_bytes
        )
        result = poller.result()
        
        # 3. Extract invoice fields
        invoice = result.documents[0]
        extracted_fields = {
            "invoiceNumber": invoice.fields.get("InvoiceId", {}).value,
            "invoiceDate": str(invoice.fields.get("InvoiceDate", {}).value),
            "vendorName": invoice.fields.get("VendorName", {}).value,
            "vendorGSTIN": extract_gstin(invoice.fields),
            "totalAmount": invoice.fields.get("InvoiceTotal", {}).value,
            "taxableAmount": invoice.fields.get("SubTotal", {}).value,
            "cgst": extract_tax(invoice.fields, "CGST"),
            "sgst": extract_tax(invoice.fields, "SGST"),
            "igst": extract_tax(invoice.fields, "IGST"),
            "lineItems": extract_line_items(invoice.fields)
        }
        
        # 4. Validate extracted data
        validation_result = validate_invoice(extracted_fields, poId)
        
        # 5. Calculate confidence score
        confidence = calculate_confidence(invoice.fields)
        
        return {
            "documentId": generate_doc_id(),
            "documentType": "INVOICE",
            "extractedAt": datetime.now().isoformat(),
            "confidence": confidence,
            "extractedFields": extracted_fields,
            "validation": validation_result,
            "rawOcrText": invoice.content
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def extract_gstin(fields):
    """Extract GSTIN from various field names"""
    gstin_fields = ["GSTIN", "GST", "TaxId", "VendorTaxId"]
    for field_name in gstin_fields:
        if field_name in fields and fields[field_name].value:
            return fields[field_name].value
    return None

def validate_invoice(extracted_fields, po_id):
    """Validate invoice against PO and GST database"""
    validation = {
        "gstinValid": False,
        "gstinVerified": False,
        "dateReasonable": False,
        "poMatch": False,
        "amountMatch": False,
        "duplicateCheck": False,
        "issues": []
    }
    
    # 1. Validate GSTIN format
    gstin = extracted_fields.get("vendorGSTIN")
    if gstin and len(gstin) == 15 and gstin[:2].isdigit():
        validation["gstinValid"] = True
        
        # 2. Verify GSTIN with GSTN API
        gstin_verified = verify_gstin_with_api(gstin)
        validation["gstinVerified"] = gstin_verified
    else:
        validation["issues"].append("Invalid GSTIN format")
    
    # 3. Check invoice date reasonableness (not future, not >1 year old)
    invoice_date = extracted_fields.get("invoiceDate")
    if invoice_date:
        date_diff = (datetime.now().date() - invoice_date).days
        if 0 <= date_diff <= 365:
            validation["dateReasonable"] = True
        else:
            validation["issues"].append(f"Invoice date {date_diff} days old")
    
    # 4. Match with PO (if provided)
    if po_id:
        po_data = fetch_po_from_database(po_id)
        if po_data:
            validation["poMatch"] = True
            # Check amount match (±5% tolerance)
            po_amount = po_data["totalAmount"]
            invoice_amount = extracted_fields["totalAmount"]
            if abs(po_amount - invoice_amount) / po_amount <= 0.05:
                validation["amountMatch"] = True
            else:
                validation["issues"].append(
                    f"Amount mismatch: PO ₹{po_amount}, Invoice ₹{invoice_amount}"
                )
    
    # 5. Duplicate check
    duplicate = check_duplicate_invoice(
        extracted_fields["invoiceNumber"],
        extracted_fields["vendorName"]
    )
    if duplicate:
        validation["duplicateCheck"] = True
        validation["issues"].append("Duplicate invoice detected")
    
    return validation

def verify_gstin_with_api(gstin):
    """Call GSTN public API to verify GST number"""
    try:
        # GSTN API endpoint (example - actual API requires authentication)
        response = requests.get(
            f"https://sheet.gst.gov.in/search?gstin={gstin}",
            timeout=5
        )
        return response.status_code == 200 and "Active" in response.text
    except:
        return False
```

---

### ML-Based Document Classification

```python
from transformers import pipeline

# Load pre-trained document classifier
classifier = pipeline("image-classification", 
                      model="microsoft/dit-base-finetuned-rvlcdip")

@app.post("/api/document/classify")
async def classify_document(file: UploadFile = File(...)):
    """Auto-classify document type (Invoice, PO, Certificate, Bid)"""
    
    # 1. Read image
    image_bytes = await file.read()
    
    # 2. Classify using ML model
    predictions = classifier(Image.open(io.BytesIO(image_bytes)))
    
    # 3. Map to procurement document types
    doc_type_mapping = {
        "invoice": "INVOICE",
        "purchase_order": "PURCHASE_ORDER",
        "specification": "TECHNICAL_BID",
        "scientific_publication": "COMPLIANCE_CERTIFICATE"
    }
    
    top_prediction = predictions[0]
    doc_type = doc_type_mapping.get(top_prediction["label"], "UNKNOWN")
    
    return {
        "documentType": doc_type,
        "confidence": top_prediction["score"],
        "allPredictions": predictions
    }
```

---

## Integration with BPMN Workflow

### Service Task: OCR Invoice Extraction

```xml
<bpmn:serviceTask id="Task_OCRInvoice" name="Extract Invoice Data via OCR" 
                  camunda:type="external" camunda:topic="ocr-extraction">
  <bpmn:incoming>Flow_InvoiceUploaded</bpmn:incoming>
  <bpmn:outgoing>Flow_to_ValidationGateway</bpmn:outgoing>
</bpmn:serviceTask>
```

### External Task Worker (Spring Boot)

```java
@Component
@RequiredArgsConstructor
public class OcrExtractionWorker {
    
    private final RestTemplate restTemplate;
    private final InvoiceRepository invoiceRepository;
    
    @ExternalTaskSubscription(topicName = "ocr-extraction")
    public void extractInvoice(ExternalTask externalTask, ExternalTaskService externalTaskService) {
        try {
            // 1. Get document URL from process variables
            String documentUrl = externalTask.getVariable("invoiceDocumentUrl");
            String poId = externalTask.getVariable("poId");
            
            // 2. Call Python OCR service
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new UrlResource(documentUrl));
            body.add("poId", poId);
            
            OcrExtractionResponse response = restTemplate.postForObject(
                    "http://document-intelligence-service:8000/api/document/extract/invoice",
                    body,
                    OcrExtractionResponse.class
            );
            
            // 3. Save extracted data to database
            Invoice invoice = new Invoice()
                    .setInvoiceNumber(response.getExtractedFields().getInvoiceNumber())
                    .setTotalAmount(response.getExtractedFields().getTotalAmount())
                    .setVendorGSTIN(response.getExtractedFields().getVendorGSTIN())
                    .setOcrConfidence(response.getConfidence());
            invoiceRepository.save(invoice);
            
            // 4. Complete task with validation results
            Map<String, Object> variables = new HashMap<>();
            variables.put("invoiceNumber", response.getExtractedFields().getInvoiceNumber());
            variables.put("totalAmount", response.getExtractedFields().getTotalAmount());
            variables.put("validationPassed", response.getValidation().isGstinValid() && 
                                             response.getValidation().isAmountMatch());
            
            externalTaskService.complete(externalTask, variables);
            
        } catch (Exception e) {
            externalTaskService.handleFailure(externalTask, e.getMessage(), 
                    e.toString(), 3, 10000L);
        }
    }
}
```

---

## Performance Metrics

| **Operation** | **Target** | **Actual** |
|--------------|----------|-----------|
| Invoice OCR extraction | <5 sec | 2-4 sec |
| Bid OCR extraction (2 docs) | <10 sec | 6-8 sec |
| GSTIN verification | <2 sec | 1.5 sec |
| Duplicate check | <1 sec | 0.5 sec |
| Confidence threshold | >0.9 | 0.92-0.96 |

---

## Error Handling

### Low Confidence Handling

```python
if confidence < 0.85:
    return {
        "documentId": doc_id,
        "confidence": confidence,
        "extractedFields": fields,
        "warning": "Low confidence extraction. Manual review recommended.",
        "flaggedForReview": True,
        "assignedTo": "finance-team"
    }
```

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Owner**: HPCL Digital Transformation Team
