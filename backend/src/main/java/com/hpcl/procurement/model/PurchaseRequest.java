package com.hpcl.procurement.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pr_records")
public class PurchaseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pr_id", unique = true, nullable = false)
    private String prId;

    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category;

    @Column(name = "dept")
    private String department;

    @Column(name = "estimated_value_inr")
    private BigDecimal estimatedValueInr;

    @Column(name = "currency")
    private String currency = "INR";

    @Column(name = "required_by_date")
    private LocalDate requiredByDate;

    @Column(name = "status")
    private String status = "DRAFT";

    @Column(name = "justification")
    private String justification;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "workflow_instance_id")
    private String workflowInstanceId;

    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "DRAFT";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPrId() { return prId; }
    public void setPrId(String prId) { this.prId = prId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public BigDecimal getEstimatedValueInr() { return estimatedValueInr; }
    public void setEstimatedValueInr(BigDecimal estimatedValueInr) { this.estimatedValueInr = estimatedValueInr; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDate getRequiredByDate() { return requiredByDate; }
    public void setRequiredByDate(LocalDate requiredByDate) { this.requiredByDate = requiredByDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getWorkflowInstanceId() { return workflowInstanceId; }
    public void setWorkflowInstanceId(String workflowInstanceId) { this.workflowInstanceId = workflowInstanceId; }
    public List<PurchaseRequestItem> getItems() { return items; }
    public void setItems(List<PurchaseRequestItem> items) { this.items = items; }
}