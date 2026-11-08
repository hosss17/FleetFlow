package com.projettest.testing.services;

import com.projettest.testing.entities.AuditLog;
import com.projettest.testing.repositories.AuditLogRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * AuditLogService - Handles business logic for AuditLog operations
 */
@Service
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    
    // Save audit log
    public AuditLog saveAuditLog(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }
    
    // Get all audit logs
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }
    
    // Get audit log by ID
    public Optional<AuditLog> getAuditLogById(Integer id) {
        return auditLogRepository.findById(id);
    }
    
    // Get audit logs by entity type
    public List<AuditLog> getAuditLogsByEntity(String entity) {
        return auditLogRepository.findByEntity(entity);
    }
    
    // Get audit logs by entity ID
    public List<AuditLog> getAuditLogsByEntityId(Integer entityId) {
        return auditLogRepository.findByEntityId(entityId);
    }
    
    // Get audit logs by user
    public List<AuditLog> getAuditLogsByUserId(Integer userId) {
        return auditLogRepository.findByUserId(userId);
    }
    
    // Get audit logs by action type
    public List<AuditLog> getAuditLogsByAction(String action) {
        return auditLogRepository.findByAction(action);
    }
}





