package com.projettest.testing.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Mission Entity - Represents missions/tasks assigned to users
 * Maps to the 'missions' table in the database
 */
@Entity
@Table(name = "missions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, length = 100)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissionPriority priority;

    @Column(name = "needs_vehicle", nullable = false)
    private Boolean needsVehicle;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissionStatus status;
    
    @Column(name = "start_datetime", nullable = false)
    private LocalDateTime startDatetime;
    
    @Column(name = "end_datetime", nullable = false)
    private LocalDateTime endDatetime;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (priority == null) {
            priority = MissionPriority.NORMAL;
        }
        if (needsVehicle == null) {
            needsVehicle = false;
        }
        if (status == null) {
            status = MissionStatus.EN_ATTENTE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum MissionPriority {
        URGENT, NORMAL
    }
    
    public enum MissionStatus {
        EN_ATTENTE,APPROUVEE,TERMINEE, ECHOUEE,REFUSEE
    }
}



