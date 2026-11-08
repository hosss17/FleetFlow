package com.projettest.testing.controllers;

import com.projettest.testing.entities.AuditLog;
import com.projettest.testing.services.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * AuditLogController - Handles HTTP requests for AuditLog operations
 * All endpoints start with /api/auditlogs
 */
@RestController
@RequestMapping("/api/auditlogs")
@CrossOrigin(origins = "*")
public class AuditLogController {
    
    private final AuditLogService auditLogService;
    
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }
    
    /**
     * GET - Get all audit logs
     * Endpoint: GET /api/auditlogs
     */
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        List<AuditLog> auditLogs = auditLogService.getAllAuditLogs();
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * GET - Get audit log by ID
     * Endpoint: GET /api/auditlogs/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> getAuditLogById(@PathVariable Integer id) {
        Optional<AuditLog> auditLog = auditLogService.getAuditLogById(id);
        return auditLog.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * POST - Create a new audit log (typically done automatically)
     * Endpoint: POST /api/auditlogs
     */
    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(@RequestBody AuditLog auditLog) {
        AuditLog savedAuditLog = auditLogService.saveAuditLog(auditLog);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAuditLog);
    }
    
    /**
     * GET - Get audit logs by entity type
     * Endpoint: GET /api/auditlogs/entity/{entity}
     */
    @GetMapping("/entity/{entity}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(@PathVariable String entity) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByEntity(entity);
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * GET - Get audit logs by entity ID
     * Endpoint: GET /api/auditlogs/entity-id/{entityId}
     */
    @GetMapping("/entity-id/{entityId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntityId(@PathVariable Integer entityId) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByEntityId(entityId);
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * GET - Get audit logs by user
     * Endpoint: GET /api/auditlogs/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUserId(@PathVariable Integer userId) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByUserId(userId);
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * GET - Get audit logs by action
     * Endpoint: GET /api/auditlogs/action/{action}
     */
    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByAction(@PathVariable String action) {
        List<AuditLog> auditLogs = auditLogService.getAuditLogsByAction(action);
        return ResponseEntity.ok(auditLogs);
    }
}





