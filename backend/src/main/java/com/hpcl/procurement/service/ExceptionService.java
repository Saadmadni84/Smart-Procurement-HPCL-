package com.hpcl.procurement.service;

import com.hpcl.procurement.model.ExceptionRecord;
import com.hpcl.procurement.repository.ExceptionRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ExceptionService {

    @Autowired
    private ExceptionRecordRepository exceptionRepository;

    private final AtomicInteger exceptionSequence = new AtomicInteger(1);

    public List<ExceptionRecord> getAllExceptions() {
        return exceptionRepository.findAll();
    }

    public List<ExceptionRecord> getExceptionsByPrId(String prId) {
        return exceptionRepository.findByPrId(prId);
    }

    public List<ExceptionRecord> getOpenExceptions() {
        return exceptionRepository.findByStatus("OPEN");
    }

    public List<ExceptionRecord> getExceptionsBySeverity(String severity) {
        return exceptionRepository.findBySeverity(severity);
    }

    public ExceptionRecord createException(ExceptionRecord exception) {
        if (exception.getExceptionId() == null) {
            exception.setExceptionId(generateExceptionId());
        }
        if (exception.getStatus() == null) {
            exception.setStatus("OPEN");
        }
        return exceptionRepository.save(exception);
    }

    public ExceptionRecord resolveException(String exceptionId, String resolution, String resolvedBy) {
        return exceptionRepository.findByExceptionId(exceptionId)
            .map(exception -> {
                exception.setStatus("RESOLVED");
                exception.setResolution(resolution);
                exception.setResolvedBy(resolvedBy);
                exception.setResolvedAt(LocalDateTime.now());
                return exceptionRepository.save(exception);
            })
            .orElseThrow(() -> new RuntimeException("Exception not found: " + exceptionId));
    }

    public ExceptionRecord escalateException(String exceptionId) {
        return exceptionRepository.findByExceptionId(exceptionId)
            .map(exception -> {
                exception.setStatus("ESCALATED");
                exception.setSeverity(escalateSeverity(exception.getSeverity()));
                return exceptionRepository.save(exception);
            })
            .orElseThrow(() -> new RuntimeException("Exception not found: " + exceptionId));
    }

    private String generateExceptionId() {
        return String.format("EXC-%s-%03d", 
            LocalDateTime.now().toLocalDate().toString().replace("-", ""),
            exceptionSequence.getAndIncrement());
    }

    private String escalateSeverity(String currentSeverity) {
        switch (currentSeverity) {
            case "LOW": return "MEDIUM";
            case "MEDIUM": return "HIGH";
            case "HIGH": return "CRITICAL";
            default: return "CRITICAL";
        }
    }
}
