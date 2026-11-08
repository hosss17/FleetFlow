package com.projettest.testing.repositories;

import com.projettest.testing.entities.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * VehicleRepository - Provides database operations for Vehicle entity
 */
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    
    // Find vehicle by license plate (matricule)
    Optional<Vehicle> findByMatricule(String matricule);
    
    // Find all available vehicles
    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);
    
    // Check if vehicle exists with matricule
    boolean existsByMatricule(String matricule);
}





