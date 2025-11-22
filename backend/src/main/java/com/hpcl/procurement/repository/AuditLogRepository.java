package com.hpcl.procurement.repository;

import com.hpcl.procurement.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);
    List<AuditLog> findByPerformedBy(String performedBy);
    List<AuditLog> findByPerformedAtBetween(LocalDateTime start, LocalDateTime end);
    List<AuditLog> findByAction(String action);
}
