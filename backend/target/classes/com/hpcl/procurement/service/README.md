Service Layer
-------------
Responsibility:
- Implement business logic: rule evaluation, approval orchestration, notifications
- Coordinate transactions across repositories and external adapters
- Provide well-typed service interfaces for controllers and for unit testing

Examples of services:
- `ProcurementService` — orchestrates PR creation and lifecycle
- `RuleEngineService` — evaluates rules and flags exceptions
- `ApprovalService` — computes approvers and routes approvals

Notes:
- Services should be stateless where possible, and unit tested thoroughly.
