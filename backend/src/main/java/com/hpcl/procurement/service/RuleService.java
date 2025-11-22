package com.hpcl.procurement.service;

import com.hpcl.procurement.model.Rule;
import com.hpcl.procurement.model.PurchaseRequest;
import com.hpcl.procurement.repository.RuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class RuleService {

    @Autowired
    private RuleRepository ruleRepository;

    public List<Rule> getAllRules() {
        return ruleRepository.findAll();
    }

    public List<Rule> getActiveRules() {
        return ruleRepository.findByActive(true);
    }

    public List<Rule> getRulesByCategory(String category) {
        return ruleRepository.findByCategoryAndActive(category, true);
    }

    public Rule createRule(Rule rule) {
        if (rule.getRuleId() == null) {
            rule.setRuleId(generateRuleId());
        }
        return ruleRepository.save(rule);
    }

    public Rule updateRule(Long id, Rule updatedRule) {
        return ruleRepository.findById(id)
            .map(existing -> {
                existing.setCategory(updatedRule.getCategory());
                existing.setFieldName(updatedRule.getFieldName());
                existing.setOperator(updatedRule.getOperator());
                existing.setRuleValue(updatedRule.getRuleValue());
                existing.setDescription(updatedRule.getDescription());
                existing.setAction(updatedRule.getAction());
                existing.setSeverity(updatedRule.getSeverity());
                existing.setAutomatable(updatedRule.getAutomatable());
                existing.setActive(updatedRule.getActive());
                return ruleRepository.save(existing);
            })
            .orElseThrow(() -> new RuntimeException("Rule not found with id: " + id));
    }

    public void deleteRule(Long id) {
        ruleRepository.deleteById(id);
    }

    /**
     * Evaluate all applicable rules against a PR
     */
    public List<RuleViolation> evaluateRules(PurchaseRequest pr) {
        List<RuleViolation> violations = new ArrayList<>();
        
        // Get category-specific rules
        List<Rule> categoryRules = getRulesByCategory(pr.getCategory());
        
        // Get ALL category rules
        List<Rule> allRules = getRulesByCategory("ALL");
        
        // Combine both lists
        categoryRules.addAll(allRules);
        
        for (Rule rule : categoryRules) {
            if (checkRuleViolation(pr, rule)) {
                violations.add(new RuleViolation(rule, pr, "Rule violation detected"));
            }
        }
        
        return violations;
    }

    private boolean checkRuleViolation(PurchaseRequest pr, Rule rule) {
        String fieldName = rule.getFieldName();
        String operator = rule.getOperator();
        String ruleValue = rule.getRuleValue();
        
        try {
            switch (fieldName) {
                case "estimatedValueInr":
                    return evaluateNumericField(pr.getEstimatedValueInr(), operator, new BigDecimal(ruleValue));
                    
                case "requiredByDate":
                    return evaluateDateField(pr.getRequiredByDate(), operator, ruleValue);
                    
                default:
                    return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    private boolean evaluateNumericField(BigDecimal fieldValue, String operator, BigDecimal ruleValue) {
        if (fieldValue == null) return false;
        
        switch (operator) {
            case ">=": return fieldValue.compareTo(ruleValue) >= 0;
            case ">": return fieldValue.compareTo(ruleValue) > 0;
            case "<=": return fieldValue.compareTo(ruleValue) <= 0;
            case "<": return fieldValue.compareTo(ruleValue) < 0;
            case "==": return fieldValue.compareTo(ruleValue) == 0;
            default: return false;
        }
    }

    private boolean evaluateDateField(LocalDate fieldValue, String operator, String ruleValue) {
        if (fieldValue == null) return false;
        
        // Parse CURRENT_DATE+7 format
        LocalDate compareDate;
        if (ruleValue.startsWith("CURRENT_DATE")) {
            compareDate = LocalDate.now();
            if (ruleValue.contains("+")) {
                int days = Integer.parseInt(ruleValue.split("\\+")[1]);
                compareDate = compareDate.plusDays(days);
            }
        } else {
            compareDate = LocalDate.parse(ruleValue);
        }
        
        switch (operator) {
            case "<": return fieldValue.isBefore(compareDate);
            case "<=": return !fieldValue.isAfter(compareDate);
            case ">": return fieldValue.isAfter(compareDate);
            case ">=": return !fieldValue.isBefore(compareDate);
            default: return false;
        }
    }

    private String generateRuleId() {
        long count = ruleRepository.count();
        return String.format("RULE-%03d", count + 1);
    }

    // Inner class for rule violations
    public static class RuleViolation {
        private final Rule rule;
        private final PurchaseRequest pr;
        private final String message;

        public RuleViolation(Rule rule, PurchaseRequest pr, String message) {
            this.rule = rule;
            this.pr = pr;
            this.message = message;
        }

        public Rule getRule() { return rule; }
        public PurchaseRequest getPr() { return pr; }
        public String getMessage() { return message; }
        public String getSeverity() { return rule.getSeverity(); }
        public String getAction() { return rule.getAction(); }
    }
}
