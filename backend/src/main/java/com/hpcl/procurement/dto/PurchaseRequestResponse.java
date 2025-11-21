package com.hpcl.procurement.dto;

import com.hpcl.procurement.model.PurchaseRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PurchaseRequestResponse {
    private String prId;
    private String description;
    private String category;
    private String department;
    private BigDecimal estimatedValueInr;
    private LocalDate requiredByDate;
    private String status;
    private String justification;
    private LocalDateTime createdAt;

    public static PurchaseRequestResponse fromEntity(PurchaseRequest pr) {
        PurchaseRequestResponse r = new PurchaseRequestResponse();
        r.prId = pr.getPrId();
        r.description = pr.getDescription();
        r.category = pr.getCategory();
        r.department = pr.getDepartment();
        r.estimatedValueInr = pr.getEstimatedValueInr();
        r.requiredByDate = pr.getRequiredByDate();
        r.status = pr.getStatus();
        r.justification = pr.getJustification();
        r.createdAt = pr.getCreatedAt();
        return r;
    }

    public String getPrId() { return prId; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getDepartment() { return department; }
    public BigDecimal getEstimatedValueInr() { return estimatedValueInr; }
    public LocalDate getRequiredByDate() { return requiredByDate; }
    public String getStatus() { return status; }
    public String getJustification() { return justification; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
