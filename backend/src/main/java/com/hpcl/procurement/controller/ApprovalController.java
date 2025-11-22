package com.hpcl.procurement.controller;

import com.hpcl.procurement.model.Approval;
import com.hpcl.procurement.service.ApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approvals")
@CrossOrigin(origins = "http://localhost:3000")
public class ApprovalController {

    @Autowired
    private ApprovalService approvalService;

    @GetMapping
    public ResponseEntity<List<Approval>> getAllApprovals() {
        return ResponseEntity.ok(approvalService.getAllApprovals());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Approval>> getPendingApprovals() {
        return ResponseEntity.ok(approvalService.getPendingApprovals());
    }

    @GetMapping("/inbox/{approverId}")
    public ResponseEntity<List<Approval>> getApprovalInbox(@PathVariable String approverId) {
        return ResponseEntity.ok(approvalService.getApprovalInbox(approverId));
    }

    @GetMapping("/pr/{prId}")
    public ResponseEntity<List<Approval>> getApprovalsByPrId(@PathVariable String prId) {
        return ResponseEntity.ok(approvalService.getApprovalsByPrId(prId));
    }

    @PostMapping
    public ResponseEntity<Approval> createApproval(@RequestBody Approval approval) {
        Approval created = approvalService.createApproval(approval);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Approval> approveRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String comments = payload.getOrDefault("comments", "");
        String approverId = payload.getOrDefault("approverId", "system");
        Approval approved = approvalService.approve(id, comments, approverId);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Approval> rejectRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String comments = payload.getOrDefault("comments", "");
        String approverId = payload.getOrDefault("approverId", "system");
        Approval rejected = approvalService.reject(id, comments, approverId);
        return ResponseEntity.ok(rejected);
    }
}
