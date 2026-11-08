package com.projettest.testing.repositories;

import com.projettest.testing.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * AuditLogRepository - Provides database operations for AuditLog entity
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    
    List<AuditLog> findByEntity(String entity);
    
    List<AuditLog> findByEntityId(Integer entityId);
    
    List<AuditLog> findByUserId(Integer userId);
    
    List<AuditLog> findByAction(String action);
}



