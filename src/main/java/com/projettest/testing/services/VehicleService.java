package com.projettest.testing.services;

import com.projettest.testing.entities.Vehicle;
import com.projettest.testing.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * VehicleService - Handles business logic for Vehicle operations
 */
@Service
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    
    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }
    
    // Save or update a vehicle
    public Vehicle saveVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }
    
    // Get all vehicles
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }
    
    // Get vehicle by ID
    public Optional<Vehicle> getVehicleById(Integer id) {
        return vehicleRepository.findById(id);
    }
    
    // Get vehicle by license plate
    public Optional<Vehicle> getVehicleByMatricule(String matricule) {
        return vehicleRepository.findByMatricule(matricule);
    }
    
    // Get all available vehicles
    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.DISPONIBLE);
    }
    
    // Get vehicles in maintenance
    public List<Vehicle> getVehiclesInMaintenance() {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.EN_MAINTENANCE);
    }
    
    // Get broken down vehicles
    public List<Vehicle> getBrokenVehicles() {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.PANNE);
    }
    
    // Delete vehicle
    public void deleteVehicle(Integer id) {
        vehicleRepository.deleteById(id);
    }
    
    // Check if vehiclepolicycle plate exists
    public boolean matriculeExists(String matricule) {
        return vehicleRepository.existsByMatricule(matricule);
    }
}





