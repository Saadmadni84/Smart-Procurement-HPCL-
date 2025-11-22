package com.hpcl.procurement.repository;

import com.hpcl.procurement.model.ExceptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, Long> {
    Optional<ExceptionRecord> findByExceptionId(String exceptionId);
    List<ExceptionRecord> findByPrId(String prId);
    List<ExceptionRecord> findByStatus(String status);
    List<ExceptionRecord> findBySeverity(String severity);
    List<ExceptionRecord> findByStatusAndSeverity(String status, String severity);
}
