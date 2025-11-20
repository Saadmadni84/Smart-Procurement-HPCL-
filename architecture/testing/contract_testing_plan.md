# Contract Testing Plan (API & Integrations)
HPCL Procurement Automation System
Version: 1.0 | Last Updated: 2025-11-21
Owner: QA Automation Lead

---
## 1. Scope
Validate stability of published API contracts (internal PR API) and external integration adapters (SAP, GeM, eSign) against OpenAPI specs & mocked providers.

## 2. Objectives
- Detect breaking changes before deployment.
- Ensure backward compatibility for consumers (frontend, external tools).
- Validate error payload structure & mandatory headers.

## 3. Artifacts
| API | Spec File | Consumer(s) |
|-----|-----------|-------------|
| PR API | `architecture/api_contracts/openapi-pr.yml` | Frontend, Workflow Service |
| SAP Adapter | `sap_integration_spec.md` (logical contract) | Procurement API |
| GeM Adapter | `gem_cppp_integration_spec.md` | Publication Scheduler |
| eSign Adapter | `dms_esign_spec.md` | Approval Workflow |

## 4. Testing Layers
1. Provider Contract Validation (Swagger/OpenAPI schema validation)
2. Consumer Pact Testing (frontend expectations vs API)
3. Error Contract Consistency (HTTP codes + body format)
4. Header & Security (Authorization, Correlation-ID)

## 5. Provider Validation (PR API)
```bash
# OpenAPI lint
npx @redocly/cli lint architecture/api_contracts/openapi-pr.yml
# Schema validation (example endpoint payload)
curl -s -H "Authorization: Bearer $TOKEN" https://api.staging/pr/123 | \
  openapi-enforcer validate architecture/api_contracts/openapi-pr.yml --path /pr/{id} --method get
```

## 6. Consumer Pact (Example)
Pact setup (frontend → PR API):
1. Frontend defines expected interaction (e.g., GET /pr/{id}).
2. Mock server returns contract-defined payload.
3. Verification stage runs against real API.

Example pact interaction JSON:
```json
{
  "consumer": {"name": "procurement-frontend"},
  "provider": {"name": "procurement-api"},
  "interactions": [
    {
      "description": "get PR by id",
      "request": {"method": "GET", "path": "/api/v1/pr/123"},
      "response": {
        "status": 200,
        "headers": {"Content-Type": "application/json"},
        "body": {"id": 123, "status": "APPROVED", "items": []}
      }
    }
  ]
}
```

## 7. Error Contracts
| Condition | Code | Required Fields |
|-----------|------|-----------------|
| Validation failure | 400 | `code`, `message`, `fieldErrors` |
| Unauthorized | 401 | `code`, `message` |
| Forbidden | 403 | `code`, `message` |
| Not Found | 404 | `code`, `message` |
| Conflict (Dup Idempotency) | 409 | `code`, `message`, `correlationId` |
| Server Error | 500 | `code`, `message`, `traceId` |

Validation command sample:
```bash
curl -s -X POST https://api.staging/api/v1/pr -H 'Authorization: Bearer BAD' | jq '.code,.message'
```

## 8. Backward Compatibility Checks
| Change Type | Allowed? | Action |
|-------------|----------|--------|
| Add optional field | Yes | Document & version notes |
| Remove field | No | Major version release required |
| Change type (int→string) | No | Avoid breaking consumers |
| Add endpoint | Yes | Update OpenAPI & notify consumers |
| Rename endpoint | No | Deprecate old + dual-serve for 1 release |

## 9. External Integrations Mocking
- SAP: WireMock stubs for PO creation success/failure.
- GeM: OAuth token mock + publish endpoints.
- eSign: Signature creation stub returning deterministic hash.

WireMock example:
```json
{
  "request": {"method": "POST", "url": "/sap/po"},
  "response": {"status": 200, "jsonBody": {"poNumber": "4500123456", "status": "CREATED"}}
}
```

## 10. Negative Contract Cases
| ID | Scenario | Expected |
|----|----------|----------|
| CON-NEG-01 | Missing Authorization header | 401 error contract |
| CON-NEG-02 | Invalid JSON schema | 400 with fieldErrors |
| CON-NEG-03 | Resource not found | 404 error payload |
| CON-NEG-04 | SAP adapter timeout | 500 with traceId |
| CON-NEG-05 | Idempotency duplicate | 409 conflict contract |

## 11. Automation Pipeline
- Step 1: Lint OpenAPI (PR gate)
- Step 2: Pact consumer tests (frontend job)
- Step 3: Provider verification (backend job)
- Step 4: External stubs integration tests
- Step 5: Publish validated spec artifact

## 12. Exit Criteria
- 0 contract test failures
- All error responses structured per matrix
- No breaking changes introduced without version bump
- Pact verification success for all registered consumers

## 13. Approvals
- QA Automation Lead
- Backend Lead
- Frontend Lead

Version History: v1.0 Initial
