package com.hpcl.procurement.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class PurchaseRequestCreateRequest {

    @NotBlank
    private String description;

    @NotBlank
    private String category;

    @NotBlank
    private String department;

    @NotNull
    @Positive
    private BigDecimal estimatedValueInr;

    @FutureOrPresent
    private LocalDate requiredByDate;

    @Size(max = 500)
    private String justification;

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public BigDecimal getEstimatedValueInr() { return estimatedValueInr; }
    public void setEstimatedValueInr(BigDecimal estimatedValueInr) { this.estimatedValueInr = estimatedValueInr; }
    public LocalDate getRequiredByDate() { return requiredByDate; }
    public void setRequiredByDate(LocalDate requiredByDate) { this.requiredByDate = requiredByDate; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
}
