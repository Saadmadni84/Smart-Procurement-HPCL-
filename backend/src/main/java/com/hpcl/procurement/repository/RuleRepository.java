package com.hpcl.procurement.repository;

import com.hpcl.procurement.model.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RuleRepository extends JpaRepository<Rule, Long> {
    Optional<Rule> findByRuleId(String ruleId);
    List<Rule> findByCategory(String category);
    List<Rule> findByActive(Boolean active);
    List<Rule> findByCategoryAndActive(String category, Boolean active);
}
