package com.hpcl.procurement.controller;

import com.hpcl.procurement.dto.PurchaseRequestCreateRequest;
import com.hpcl.procurement.dto.PurchaseRequestResponse;
import com.hpcl.procurement.model.PurchaseRequest;
import com.hpcl.procurement.service.PurchaseRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pr")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseRequestController {

    private final PurchaseRequestService service;

    public PurchaseRequestController(PurchaseRequestService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PurchaseRequestResponse> create(@Valid @RequestBody PurchaseRequestCreateRequest req) {
        PurchaseRequest pr = service.create(
                req.getDescription(),
                req.getCategory(),
                req.getEstimatedValueInr(),
                req.getDepartment(),
                req.getJustification(),
                req.getRequiredByDate()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PurchaseRequestResponse.fromEntity(pr));
    }

    @GetMapping
    public List<PurchaseRequestResponse> list() {
        return service.listAll().stream().map(PurchaseRequestResponse::fromEntity).collect(Collectors.toList());
    }

    @GetMapping("/{prId}")
    public ResponseEntity<PurchaseRequestResponse> get(@PathVariable String prId) {
        return service.findByBusinessId(prId)
                .map(PurchaseRequestResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{prId}/approve")
    public ResponseEntity<PurchaseRequestResponse> approve(@PathVariable String prId) {
        return service.approve(prId, null)
                .map(PurchaseRequestResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{prId}/reject")
    public ResponseEntity<PurchaseRequestResponse> reject(@PathVariable String prId) {
        return service.reject(prId, null)
                .map(PurchaseRequestResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
