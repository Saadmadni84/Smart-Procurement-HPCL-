Model Layer
-----------
Responsibility:
- JPA entity definitions for PRs, rules, approvals, audit logs
- DTOs for API payloads (separate `dto` package recommended)

Examples:
- `PrRecord` entity mapping to `pr_records` table
- `ProcurementRule` entity mapping to `procurement_rules` table

Notes:
- Use Lombok for boilerplate, but keep entities simple and avoid exposing entities directly over the wire.
