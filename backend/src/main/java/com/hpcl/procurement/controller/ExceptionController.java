package com.hpcl.procurement.controller;

import com.hpcl.procurement.model.ExceptionRecord;
import com.hpcl.procurement.service.ExceptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exceptions")
@CrossOrigin(origins = "http://localhost:3000")
public class ExceptionController {

    @Autowired
    private ExceptionService exceptionService;

    @GetMapping
    public ResponseEntity<List<ExceptionRecord>> getAllExceptions() {
        return ResponseEntity.ok(exceptionService.getAllExceptions());
    }

    @GetMapping("/open")
    public ResponseEntity<List<ExceptionRecord>> getOpenExceptions() {
        return ResponseEntity.ok(exceptionService.getOpenExceptions());
    }

    @GetMapping("/pr/{prId}")
    public ResponseEntity<List<ExceptionRecord>> getExceptionsByPrId(@PathVariable String prId) {
        return ResponseEntity.ok(exceptionService.getExceptionsByPrId(prId));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<List<ExceptionRecord>> getExceptionsBySeverity(@PathVariable String severity) {
        return ResponseEntity.ok(exceptionService.getExceptionsBySeverity(severity));
    }

    @PostMapping
    public ResponseEntity<ExceptionRecord> createException(@RequestBody ExceptionRecord exception) {
        ExceptionRecord created = exceptionService.createException(exception);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/{exceptionId}/resolve")
    public ResponseEntity<ExceptionRecord> resolveException(
            @PathVariable String exceptionId,
            @RequestBody Map<String, String> payload) {
        String resolution = payload.getOrDefault("resolution", "");
        String resolvedBy = payload.getOrDefault("resolvedBy", "system");
        ExceptionRecord resolved = exceptionService.resolveException(exceptionId, resolution, resolvedBy);
        return ResponseEntity.ok(resolved);
    }

    @PostMapping("/{exceptionId}/escalate")
    public ResponseEntity<ExceptionRecord> escalateException(@PathVariable String exceptionId) {
        ExceptionRecord escalated = exceptionService.escalateException(exceptionId);
        return ResponseEntity.ok(escalated);
    }
}
