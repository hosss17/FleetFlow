package com.projettest.testing.repositories;

import com.projettest.testing.entities.QRCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * QRCodeRepository - Provides database operations for QRCode entity
 */
@Repository
public interface QRCodeRepository extends JpaRepository<QRCode, Integer> {
    
    // Find all QR codes for a mission
    List<QRCode> findByMissionId(Integer missionId);
    
    // Find all QR codes with specific status
    List<QRCode> findByStatus(QRCode.QRCodeStatus status);
    
    // Find all QR codes for a user
    List<QRCode> findByUserId(Integer userId);
    
    // Find all QR codes for a vehicle
    List<QRCode> findByVehicleId(Integer vehicleId);
}





