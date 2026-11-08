package com.projettest.testing.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * AuditLog Entity - Tracks all changes made to entities in the system
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, length = 50)
    private String entity;
    
    @Column(name = "entity_id", nullable = false)
    private Integer entityId;
    
    @Column(nullable = false, length = 50)
    private String action;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "old_value", columnDefinition = "LONGTEXT")
    private String oldValue;
    
    @Column(name = "new_value", columnDefinition = "LONGTEXT")
    private String newValue;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}



