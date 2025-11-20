Controller Layer
----------------
Responsibility:
- Expose REST endpoints for clients (frontend, API gateway)
- Validate request payloads and map DTOs to service calls
- Convert service responses to HTTP responses and appropriate status codes

Examples of endpoints to be added in Step 2:
- `POST /api/prs` — create PR
- `GET /api/prs/{id}` — fetch PR details
- `GET /api/approvals/pending` — fetch pending approvals
- `POST /api/rules/evaluate` — evaluate rules against a PR

Notes:
- Controllers should be thin and delegate business logic to services.
