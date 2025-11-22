package com.hpcl.procurement.service;

import com.hpcl.procurement.model.Approval;
import com.hpcl.procurement.repository.ApprovalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApprovalService {

    @Autowired
    private ApprovalRepository approvalRepository;

    public List<Approval> getAllApprovals() {
        return approvalRepository.findAll();
    }

    public List<Approval> getApprovalsByPrId(String prId) {
        return approvalRepository.findByPrId(prId);
    }

    public List<Approval> getApprovalInbox(String approverId) {
        return approvalRepository.findByApproverIdAndStatus(approverId, "PENDING");
    }

    public List<Approval> getPendingApprovals() {
        return approvalRepository.findByStatus("PENDING");
    }

    public Approval createApproval(Approval approval) {
        if (approval.getStatus() == null) {
            approval.setStatus("PENDING");
        }
        return approvalRepository.save(approval);
    }

    public Approval approve(Long approvalId, String comments, String approverId) {
        return approvalRepository.findById(approvalId)
            .map(approval -> {
                approval.setStatus("APPROVED");
                approval.setComments(comments);
                approval.setApprovedAt(LocalDateTime.now());
                return approvalRepository.save(approval);
            })
            .orElseThrow(() -> new RuntimeException("Approval not found with id: " + approvalId));
    }

    public Approval reject(Long approvalId, String comments, String approverId) {
        return approvalRepository.findById(approvalId)
            .map(approval -> {
                approval.setStatus("REJECTED");
                approval.setComments(comments);
                approval.setApprovedAt(LocalDateTime.now());
                return approvalRepository.save(approval);
            })
            .orElseThrow(() -> new RuntimeException("Approval not found with id: " + approvalId));
    }

    /**
     * Create approval workflow for a PR based on value thresholds
     */
    public List<Approval> createApprovalWorkflow(String prId, String category, java.math.BigDecimal estimatedValue) {
        List<Approval> approvals = new java.util.ArrayList<>();
        
        // Level 1: Department Manager (always required)
        Approval level1 = new Approval();
        level1.setPrId(prId);
        level1.setApprovalLevel(1);
        level1.setApproverId("dept.manager@hpcl.co.in");
        level1.setApproverName("Department Manager");
        level1.setStatus("PENDING");
        approvals.add(approvalRepository.save(level1));
        
        // Level 2: CFO (for values > 10 lakhs)
        if (estimatedValue.compareTo(new java.math.BigDecimal("1000000")) > 0) {
            Approval level2 = new Approval();
            level2.setPrId(prId);
            level2.setApprovalLevel(2);
            level2.setApproverId("cfo@hpcl.co.in");
            level2.setApproverName("Chief Financial Officer");
            level2.setStatus("PENDING");
            approvals.add(approvalRepository.save(level2));
        }
        
        // Level 3: Board (for values > 5 Cr)
        if (estimatedValue.compareTo(new java.math.BigDecimal("50000000")) > 0) {
            Approval level3 = new Approval();
            level3.setPrId(prId);
            level3.setApprovalLevel(3);
            level3.setApproverId("board@hpcl.co.in");
            level3.setApproverName("Board of Directors");
            level3.setStatus("PENDING");
            approvals.add(approvalRepository.save(level3));
        }
        
        return approvals;
    }
}
