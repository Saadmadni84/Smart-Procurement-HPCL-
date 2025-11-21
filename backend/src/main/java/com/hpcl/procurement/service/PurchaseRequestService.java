package com.hpcl.procurement.service;

import com.hpcl.procurement.model.PurchaseRequest;
import com.hpcl.procurement.repository.PurchaseRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PurchaseRequestService {

    private final PurchaseRequestRepository repository;
    private final AtomicInteger dailyCounter = new AtomicInteger(0);

    public PurchaseRequestService(PurchaseRequestRepository repository) {
        this.repository = repository;
    }

    public List<PurchaseRequest> listAll() {
        return repository.findAll();
    }

    public Optional<PurchaseRequest> findByBusinessId(String prId) {
        return repository.findByPrId(prId);
    }

    @Transactional
    public PurchaseRequest create(String description, String category, BigDecimal estimatedValueInr,
                                  String department, String justification, LocalDate requiredByDate) {
        PurchaseRequest pr = new PurchaseRequest();
        pr.setDescription(description);
        pr.setCategory(category);
        pr.setEstimatedValueInr(estimatedValueInr);
        pr.setDepartment(department);
        pr.setJustification(justification);
        pr.setRequiredByDate(requiredByDate);
        pr.setPrId(generateBusinessId());
        pr.setStatus("DRAFT");
        return repository.save(pr);
    }

    @Transactional
    public Optional<PurchaseRequest> approve(String prId, String comments) {
        return repository.findByPrId(prId).map(pr -> {
            pr.setStatus("APPROVED");
            return repository.save(pr);
        });
    }

    @Transactional
    public Optional<PurchaseRequest> reject(String prId, String reason) {
        return repository.findByPrId(prId).map(pr -> {
            pr.setStatus("REJECTED");
            return repository.save(pr);
        });
    }

    private String generateBusinessId() {
        // Simple daily counter business ID e.g. PR-2025-11-21-001
        int seq = dailyCounter.incrementAndGet();
        return "PR-" + LocalDate.now() + String.format("-%03d", seq);
    }
}