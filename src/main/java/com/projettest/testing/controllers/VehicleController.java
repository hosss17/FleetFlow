package com.projettest.testing.controllers;

import com.projettest.testing.entities.Vehicle;
import com.projettest.testing.services.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {
    
    private final VehicleService vehicleService;
    
    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }
    
    /**
     * GET - Get all vehicles
     */
    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        List<Vehicle> vehicles = vehicleService.getAllVehicles();
        return ResponseEntity.ok(vehicles);
    }
    
    /**
     * GET - Get vehicle by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Integer id) {
        Optional<Vehicle> vehicle = vehicleService.getVehicleById(id);
        return vehicle.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * POST - Create a new vehicle
     */
    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        Vehicle savedVehicle = vehicleService.saveVehicle(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedVehicle);
    }
    
    /**
     * PUT - Update a vehicle
     */
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Integer id, @RequestBody Vehicle vehicle) {
        Optional<Vehicle> existingVehicle = vehicleService.getVehicleById(id);
        if (existingVehicle.isPresent()) {
            vehicle.setId(id);
            Vehicle updatedVehicle = vehicleService.saveVehicle(vehicle);
            return ResponseEntity.ok(updatedVehicle);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * DELETE - Delete a vehicle
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Integer id) {
        if (vehicleService.getVehicleById(id).isPresent()) {
            vehicleService.deleteVehicle(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * GET - Get all available vehicles
     */
    @GetMapping("/status/available")
    public ResponseEntity<List<Vehicle>> getAvailableVehicles() {
        List<Vehicle> vehicles = vehicleService.getAvailableVehicles();
        return ResponseEntity.ok(vehicles);
    }
    
    /**
     * GET - Get vehicles in maintenance
     */
    @GetMapping("/status/maintenance")
    public ResponseEntity<List<Vehicle>> getVehiclesInMaintenance() {
        List<Vehicle> vehicles = vehicleService.getVehiclesInMaintenance();
        return ResponseEntity.ok(vehicles);
    }
    
    /**
     * GET - Get broken vehicles
     */
    @GetMapping("/status/broken")
    public ResponseEntity<List<Vehicle>> getBrokenVehicles() {
        List<Vehicle> vehicles = vehicleService.getBrokenVehicles();
        return ResponseEntity.ok(vehicles);
    }
}



