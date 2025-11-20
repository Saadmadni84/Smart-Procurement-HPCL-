# Rule Engine Service Specification

## Overview
The Rule Engine Service evaluates CVC compliance rules, procurement policies, and business logic against PR/PO data using Drools (Red Hat Decision Manager) or a custom rule evaluation engine.

---

## Technology Stack
- **Rule Engine**: Drools 8.x (KIE Server) OR Custom Spring-based rule engine
- **Framework**: Spring Boot 3.2.2
- **Language**: Java 17
- **Rule Format**: DRL (Drools Rule Language) OR Decision Tables (Excel/CSV)
- **Database**: PostgreSQL (rule repository)
- **Cache**: Redis (rule execution cache)

---

## Rule Categories

### 1. CVC Compliance Rules
- Single vendor justification requirements
- Proprietary purchase approvals
- Emergency procurement thresholds
- Splitting of purchases prohibition
- Bid security (EMD) requirements

### 2. Value-Based Approval Rules
- <₹50,000: Auto-approval OR Buyer manager
- ₹50,000 - ₹5,00,000: Department manager approval
- >₹5,00,000: CFO/MD approval + CVC committee

### 3. Category-Specific Rules
- IT procurement: IT Head approval for >₹2L
- Capital equipment: Technical committee review
- Consultancy services: MD approval mandatory
- Import purchases: Finance pre-approval for forex

### 4. Vendor Rules
- Blacklist check (CVC debarred, internal blacklist)
- Vendor rating thresholds (minimum 3.5/5 for >₹10L)
- Vendor eligibility by category
- MSE/MSME preference rules (GeM mandatory for certain categories)

---

## Rule Definition Format

### Drools DRL Example

```drools
package com.hpcl.procurement.rules

import com.hpcl.procurement.model.PrRecord;
import com.hpcl.procurement.model.RuleResult;

rule "CVC-01: Written Justification for Value > 1L"
    when
        $pr : PrRecord(estimatedValue > 100000, justification == null || justification.trim().isEmpty())
    then
        RuleResult result = new RuleResult();
        result.setRuleId("CVC-01");
        result.setDescription("Written justification required for purchases above ₹1,00,000");
        result.setAction("REQUIRE_JUSTIFICATION");
        result.setSeverity("MEDIUM");
        result.setCompliant(false);
        result.setRecommendation("Buyer must provide written justification explaining need and urgency");
        insert(result);
end

rule "CVC-02: MD Approval for Proprietary Items > 1L"
    when
        $pr : PrRecord(category == "Proprietary", estimatedValue > 100000)
    then
        RuleResult result = new RuleResult();
        result.setRuleId("CVC-02");
        result.setDescription("MD approval mandatory for proprietary purchases above ₹1L");
        result.setAction("ADD_APPROVER");
        result.setSeverity("HIGH");
        result.setCompliant(true);
        result.setRequiredApprover("MD");
        result.setRecommendation("Route to MD for approval with technical justification");
        insert(result);
end

rule "CVC-03: Single Vendor Justification + CVC Form 17"
    when
        $pr : PrRecord(singleVendor == true, estimatedValue > 50000, cvcForm17Attached == false)
    then
        RuleResult result = new RuleResult();
        result.setRuleId("CVC-03");
        result.setDescription("CVC Form 17 required for single vendor purchases above ₹50,000");
        result.setAction("REQUIRE_DOCUMENT");
        result.setSeverity("HIGH");
        result.setCompliant(false);
        result.setRequiredDocument("CVC Form 17 - Single Vendor Justification");
        result.setRecommendation("Attach CVC Form 17 signed by competent authority");
        insert(result);
end

rule "IT-01: IT Head Approval for IT Hardware > 2L"
    when
        $pr : PrRecord(category == "IT Hardware", estimatedValue > 200000)
    then
        RuleResult result = new RuleResult();
        result.setRuleId("IT-01");
        result.setDescription("IT Head approval required for IT Hardware above ₹2L");
        result.setAction("ADD_APPROVER");
        result.setSeverity("MEDIUM");
        result.setCompliant(true);
        result.setRequiredApprover("IT_HEAD");
        result.setRecommendation("Add IT Head to approval chain");
        insert(result);
end

rule "FIN-01: Budget Availability Check"
    when
        $pr : PrRecord(budgetAvailable == false)
    then
        RuleResult result = new RuleResult();
        result.setRuleId("FIN-01");
        result.setDescription("Budget not available in allocated cost center");
        result.setAction("REJECT_PR");
        result.setSeverity("CRITICAL");
        result.setCompliant(false);
        result.setRecommendation("Finance Manager must reallocate budget OR defer PR to next quarter");
        insert(result);
end

rule "VENDOR-01: Blacklisted Vendor Check"
    when
        $pr : PrRecord(vendorBlacklisted == true)
    then
        RuleResult result = new RuleResult();
        result.setRuleId("VENDOR-01");
        result.setDescription("Vendor is blacklisted (CVC debarred or internal blacklist)");
        result.setAction("REJECT_PR");
        result.setSeverity("CRITICAL");
        result.setCompliant(false);
        result.setRecommendation("Select alternative vendor. CVO approval required for override.");
        insert(result);
end
```

### Decision Table Format (Excel/CSV)

| Rule ID | Condition: Category | Condition: Value | Condition: Vendor Type | Action | Severity | Required Approver | Required Document |
|---------|-------------------|-----------------|----------------------|--------|----------|------------------|------------------|
| CVC-01 | * | >100000 | * | REQUIRE_JUSTIFICATION | MEDIUM | - | Written Justification |
| CVC-02 | Proprietary | >100000 | * | ADD_APPROVER | HIGH | MD | Technical Justification |
| CVC-03 | * | >50000 | Single Vendor | REQUIRE_DOCUMENT | HIGH | - | CVC Form 17 |
| IT-01 | IT Hardware | >200000 | * | ADD_APPROVER | MEDIUM | IT_HEAD | - |
| IT-02 | IT Software | >500000 | * | ADD_APPROVER | HIGH | CTO,CFO | License Audit Report |
| GEM-01 | * | >25000 | * | CHECK_GEM_AVAILABILITY | MEDIUM | - | GeM Non-Availability Certificate |
| MSE-01 | * | >100000 | MSE/MSME | APPLY_DISCOUNT | LOW | - | MSE Registration Certificate |

---

## API Endpoints

### 1. Evaluate Rules

**Endpoint**: `POST /api/rules/evaluate`

**Description**: Evaluates all applicable rules for a PR

**Request Body**:
```json
{
  "prId": "PR-2025-05-001",
  "category": "IT Hardware",
  "estimatedValue": 250000,
  "vendorName": "Dell India",
  "vendorCode": "VENDOR-DELL-001",
  "singleVendor": false,
  "budgetAvailable": true,
  "justification": "Replace 5-year-old laptops, Windows 11 upgrade required",
  "cvcForm17Attached": false,
  "urgency": "NORMAL"
}
```

**Response** (200 OK):
```json
{
  "prId": "PR-2025-05-001",
  "overallCompliance": true,
  "totalRulesEvaluated": 15,
  "rulesTriggered": 2,
  "ruleResults": [
    {
      "ruleId": "CVC-01",
      "description": "Written justification required for purchases above ₹1,00,000",
      "action": "REQUIRE_JUSTIFICATION",
      "severity": "MEDIUM",
      "compliant": true,
      "recommendation": "Justification provided: 'Replace 5-year-old laptops, Windows 11 upgrade required'",
      "evaluatedAt": "2025-05-15T10:00:15Z"
    },
    {
      "ruleId": "IT-01",
      "description": "IT Head approval required for IT Hardware above ₹2L",
      "action": "ADD_APPROVER",
      "severity": "MEDIUM",
      "compliant": true,
      "requiredApprover": "IT_HEAD",
      "recommendation": "Add IT Head to approval chain",
      "evaluatedAt": "2025-05-15T10:00:15Z"
    }
  ],
  "requiredApprovers": ["MANAGER", "IT_HEAD"],
  "requiredDocuments": [],
  "estimatedApprovalTime": "6-12 hours"
}
```

**Non-Compliant Response**:
```json
{
  "prId": "PR-2025-05-003",
  "overallCompliance": false,
  "totalRulesEvaluated": 15,
  "rulesTriggered": 3,
  "ruleResults": [
    {
      "ruleId": "CVC-03",
      "description": "CVC Form 17 required for single vendor purchases above ₹50,000",
      "action": "REQUIRE_DOCUMENT",
      "severity": "HIGH",
      "compliant": false,
      "requiredDocument": "CVC Form 17 - Single Vendor Justification",
      "recommendation": "Attach CVC Form 17 signed by competent authority",
      "evaluatedAt": "2025-05-15T11:30:20Z"
    },
    {
      "ruleId": "VENDOR-01",
      "description": "Vendor is blacklisted (CVC debarred or internal blacklist)",
      "action": "REJECT_PR",
      "severity": "CRITICAL",
      "compliant": false,
      "recommendation": "Select alternative vendor. CVO approval required for override.",
      "evaluatedAt": "2025-05-15T11:30:20Z"
    }
  ],
  "blockers": [
    "Vendor blacklisted - CVO approval required",
    "CVC Form 17 missing - Upload required"
  ]
}
```

---

### 2. Get Rule Catalog

**Endpoint**: `GET /api/rules/catalog`

**Description**: Retrieves all active rules with filtering

**Query Parameters**:
- `category` (optional): Filter by PR category (e.g., "IT Hardware")
- `severity` (optional): Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)
- `automatable` (optional): Filter by automatable flag (true/false)

**Response** (200 OK):
```json
{
  "totalRules": 127,
  "rules": [
    {
      "ruleId": "CVC-01",
      "description": "Written justification required for purchases above ₹1,00,000",
      "category": "*",
      "valueThreshold": 100000,
      "action": "REQUIRE_JUSTIFICATION",
      "severity": "MEDIUM",
      "automatable": true,
      "cvcReference": "CVC Manual Section 4.2.1",
      "activeFrom": "2020-01-01",
      "activeTo": null,
      "createdBy": "cvo_officer",
      "lastModified": "2024-03-15T09:00:00Z"
    },
    {
      "ruleId": "CVC-02",
      "description": "MD approval mandatory for proprietary purchases above ₹1L",
      "category": "Proprietary",
      "valueThreshold": 100000,
      "action": "ADD_APPROVER",
      "severity": "HIGH",
      "automatable": true,
      "requiredApprover": "MD",
      "cvcReference": "CVC Manual Section 5.3.2 - Proprietary Purchases",
      "activeFrom": "2018-06-01",
      "activeTo": null
    }
  ]
}
```

---

### 3. Create/Update Rule

**Endpoint**: `POST /api/rules` (Admin only)

**Description**: Creates a new compliance rule

**Request Body**:
```json
{
  "ruleId": "HPCL-101",
  "description": "Safety equipment purchases require HSE approval above ₹50,000",
  "category": "Safety Equipment",
  "fieldName": "estimatedValue",
  "operator": ">",
  "ruleValue": "50000",
  "action": "ADD_APPROVER",
  "severity": "HIGH",
  "automatable": true,
  "requiredApprover": "HSE_HEAD",
  "cvcReference": "HPCL Safety Policy 2024",
  "activeFrom": "2025-06-01"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "ruleId": "HPCL-101",
  "message": "Rule created successfully and deployed to rule engine",
  "deployedAt": "2025-05-15T12:00:00Z"
}
```

---

## Service Implementation

### Rule Evaluation Service (Drools)

```java
@Service
@RequiredArgsConstructor
public class RuleEngineService {
    
    private final KieContainer kieContainer;
    private final ProcurementRuleRepository ruleRepository;
    private final AuditLogRepository auditLogRepository;
    
    public RuleEvaluationResult evaluateRules(PrRecord pr) {
        // 1. Create KIE session
        KieSession kSession = kieContainer.newKieSession("procurement-rules");
        
        try {
            // 2. Insert PR facts
            kSession.insert(pr);
            
            // 3. Insert additional facts (vendor blacklist, budget status)
            VendorFact vendorFact = new VendorFact()
                    .setVendorCode(pr.getVendorCode())
                    .setBlacklisted(checkVendorBlacklist(pr.getVendorCode()))
                    .setRating(getVendorRating(pr.getVendorCode()));
            kSession.insert(vendorFact);
            
            BudgetFact budgetFact = new BudgetFact()
                    .setCostCenter(pr.getCostCenter())
                    .setBudgetAvailable(pr.getBudgetAvailable())
                    .setRemainingBudget(getRemainingBudget(pr.getCostCenter()));
            kSession.insert(budgetFact);
            
            // 4. Fire all rules
            int rulesFired = kSession.fireAllRules();
            
            // 5. Collect results
            List<RuleResult> results = new ArrayList<>();
            for (Object obj : kSession.getObjects(new ClassObjectFilter(RuleResult.class))) {
                results.add((RuleResult) obj);
            }
            
            // 6. Determine overall compliance
            boolean overallCompliance = results.stream()
                    .filter(r -> !r.isCompliant())
                    .count() == 0;
            
            // 7. Extract required approvers
            List<String> requiredApprovers = results.stream()
                    .filter(r -> r.getRequiredApprover() != null)
                    .map(RuleResult::getRequiredApprover)
                    .distinct()
                    .collect(Collectors.toList());
            
            // 8. Log audit trail
            auditLogRepository.save(new AuditLog()
                    .setPrId(pr.getPrId())
                    .setEventType("RULE_EVALUATION")
                    .setUserId("system")
                    .setComment(String.format("Evaluated %d rules, %d triggered", rulesFired, results.size()))
                    .setTimestamp(LocalDateTime.now()));
            
            return new RuleEvaluationResult()
                    .setPrId(pr.getPrId())
                    .setOverallCompliance(overallCompliance)
                    .setTotalRulesEvaluated(rulesFired)
                    .setRulesTriggered(results.size())
                    .setRuleResults(results)
                    .setRequiredApprovers(requiredApprovers);
            
        } finally {
            kSession.dispose();
        }
    }
    
    private boolean checkVendorBlacklist(String vendorCode) {
        // Check CVC debarred list + HPCL internal blacklist
        return vendorBlacklistRepository.existsByVendorCode(vendorCode);
    }
    
    private double getVendorRating(String vendorCode) {
        return vendorRepository.findByVendorCode(vendorCode)
                .map(Vendor::getRating)
                .orElse(0.0);
    }
    
    private BigDecimal getRemainingBudget(String costCenter) {
        return budgetService.getRemainingBudget(costCenter);
    }
}
```

### Rule Repository (Database-backed)

```java
@Repository
public interface ProcurementRuleRepository extends JpaRepository<ProcurementRule, Long> {
    
    List<ProcurementRule> findByActiveTrue();
    
    List<ProcurementRule> findByCategoryAndActiveTrue(String category);
    
    List<ProcurementRule> findBySeverityAndActiveTrue(String severity);
    
    Optional<ProcurementRule> findByRuleId(String ruleId);
}
```

### Rule Entity

```java
@Entity
@Table(name = "procurement_rules")
@Data
public class ProcurementRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String ruleId;
    
    @Column(nullable = false)
    private String category; // "*" for all categories
    
    @Column(nullable = false)
    private String fieldName; // e.g., "estimatedValue", "vendorType"
    
    @Column(nullable = false)
    private String operator; // ">", "<", "==", "!=", "contains"
    
    @Column(nullable = false)
    private String ruleValue; // e.g., "100000", "Proprietary"
    
    @Column(nullable = false, length = 500)
    private String description;
    
    @Column(nullable = false)
    private String action; // REQUIRE_JUSTIFICATION, ADD_APPROVER, REQUIRE_DOCUMENT, REJECT_PR
    
    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW
    
    private Boolean automatable = true;
    
    private String requiredApprover; // MD, CFO, IT_HEAD, CVO
    
    private String requiredDocument; // CVC Form 17, Technical Spec, etc.
    
    private String cvcReference; // Link to CVC manual section
    
    @Column(nullable = false)
    private Boolean active = true;
    
    private LocalDate activeFrom;
    
    private LocalDate activeTo;
    
    private String createdBy;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime lastModified;
}
```

---

## Rule Execution Flow (BPMN Integration)

### Service Task Configuration

```xml
<bpmn:serviceTask id="Task_RuleEngine" name="Rule Engine Evaluation" 
                  camunda:type="external" camunda:topic="rule-evaluation">
  <bpmn:incoming>Flow_from_BudgetCheck</bpmn:incoming>
  <bpmn:outgoing>Flow_to_ApprovalGateway</bpmn:outgoing>
</bpmn:serviceTask>
```

### External Task Worker

```java
@Component
@RequiredArgsConstructor
public class RuleEvaluationWorker {
    
    private final RuleEngineService ruleEngineService;
    private final PrRepository prRepository;
    
    @ExternalTaskSubscription(topicName = "rule-evaluation")
    public void evaluateRules(ExternalTask externalTask, ExternalTaskService externalTaskService) {
        try {
            // 1. Get PR ID from process variables
            String prId = externalTask.getVariable("prId");
            
            // 2. Fetch PR from database
            PrRecord pr = prRepository.findByPrId(prId)
                    .orElseThrow(() -> new RuntimeException("PR not found: " + prId));
            
            // 3. Evaluate rules
            RuleEvaluationResult result = ruleEngineService.evaluateRules(pr);
            
            // 4. Update process variables
            Map<String, Object> variables = new HashMap<>();
            variables.put("overallCompliance", result.isOverallCompliance());
            variables.put("requiredApprovers", result.getRequiredApprovers());
            variables.put("ruleResults", result.getRuleResults());
            
            // 5. Complete task
            externalTaskService.complete(externalTask, variables);
            
        } catch (Exception e) {
            // Handle failure
            externalTaskService.handleFailure(externalTask, e.getMessage(), 
                    e.toString(), 3, 5000L);
        }
    }
}
```

---

## Caching Strategy

### Redis Cache for Rule Results

```java
@Cacheable(value = "rule-evaluations", key = "#pr.prId + '_' + #pr.estimatedValue")
public RuleEvaluationResult evaluateRules(PrRecord pr) {
    // Rule evaluation logic (cached for 1 hour)
}

@CacheEvict(value = "rule-evaluations", allEntries = true)
public void clearRuleCache() {
    // Called when rules are updated
}
```

---

## Performance Metrics

| **Metric** | **Target** | **Actual** |
|-----------|----------|-----------|
| Rule evaluation time | <500ms | 200-350ms |
| Rules per evaluation | 100+ | 127 |
| Cache hit rate | >80% | 85% |
| Concurrent evaluations | 1000/min | Supported |

---

## Sample Rules Catalog

| Rule ID | Description | Threshold | Approver | Automatable |
|---------|------------|-----------|----------|------------|
| CVC-01 | Written justification required | >₹1L | - | Yes |
| CVC-02 | MD approval for proprietary | >₹1L | MD | Yes |
| CVC-03 | Single vendor Form 17 | >₹50K | - | Yes |
| CVC-04 | Emergency procurement MD approval | Any value | MD | Yes |
| CVC-05 | Tender mandatory | >₹5L | - | Yes |
| IT-01 | IT Head approval | >₹2L | IT_HEAD | Yes |
| IT-02 | CTO approval for software | >₹5L | CTO, CFO | Yes |
| FIN-01 | Budget availability check | Any | - | Yes |
| FIN-02 | Forex approval for imports | >$10K | CFO | Yes |
| VENDOR-01 | Blacklist check | Any | - | Yes |
| VENDOR-02 | Vendor rating threshold | >₹10L | - | Yes |
| GEM-01 | GeM availability check | >₹25K | - | Yes |
| MSE-01 | MSE preference | >₹1L | - | Yes |

---

**Document Version**: 1.0  
**Last Updated**: May 2025  
**Owner**: HPCL Digital Transformation Team
