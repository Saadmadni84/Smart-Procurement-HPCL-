package com.hpcl.procurement.repository;

import com.hpcl.procurement.model.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByPrId(String prId);
    List<Approval> findByApproverId(String approverId);
    List<Approval> findByApproverIdAndStatus(String approverId, String status);
    List<Approval> findByStatus(String status);
}
