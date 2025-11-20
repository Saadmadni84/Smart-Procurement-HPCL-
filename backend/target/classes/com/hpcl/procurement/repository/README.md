Repository Layer
----------------
Responsibility:
- Encapsulate data access using Spring Data JPA repositories
- Provide CRUD operations and common queries for PRs, rules, and approvals

Examples:
- `PrRecordRepository extends JpaRepository<PrRecord, Long>`
- `ProcurementRuleRepository extends JpaRepository<ProcurementRule, Long>`

Notes:
- Use JPA entity mapping in `model` package. Keep queries efficient and add pagination where appropriate.
