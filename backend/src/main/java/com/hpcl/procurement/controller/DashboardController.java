package com.hpcl.procurement.controller;

import com.hpcl.procurement.service.PurchaseRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    @Autowired
    private PurchaseRequestService prService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        long totalPRs = prService.listAll().size();
        long pendingPRs = prService.listAll().stream()
            .filter(pr -> "PENDING_APPROVAL".equals(pr.getStatus()))
            .count();
        long approvedPRs = prService.listAll().stream()
            .filter(pr -> "APPROVED".equals(pr.getStatus()))
            .count();
        long draftPRs = prService.listAll().stream()
            .filter(pr -> "DRAFT".equals(pr.getStatus()))
            .count();
        
        summary.put("totalPRs", totalPRs);
        summary.put("pendingApprovals", pendingPRs);
        summary.put("approved", approvedPRs);
        summary.put("drafts", draftPRs);
        summary.put("activeExceptions", 0); // Placeholder
        summary.put("totalValue", 0); // Placeholder
        
        return ResponseEntity.ok(summary);
    }
}
