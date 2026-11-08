package com.projettest.testing.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Vehicle Entity - Represents vehicles available for missions
 * Maps to the 'vehicles' table in the database
 */
@Entity
@Table(name = "vehicles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String matricule;

    @Column(name = "model", nullable = false, length = 100)
    private String model;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status;
    
    @Column(nullable = false)
    private Integer kilometrage;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (model == null || model.isBlank()) {
            model = "Modele non renseigne";
        }
        if (status == null) {
            status = VehicleStatus.DISPONIBLE;
        }
        if (kilometrage == null) {
            kilometrage = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Enum for Vehicle Status
    public enum VehicleStatus {
        DISPONIBLE, RESERVE, EN_MAINTENANCE, PANNE
    }
}





