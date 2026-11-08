package com.projettest.testing.services;

import com.projettest.testing.entities.QRCode;
import com.projettest.testing.repositories.QRCodeRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * QRCodeService - Handles business logic for QRCode operations
 */
@Service
public class QRCodeService {
    
    private final QRCodeRepository qrCodeRepository;
    
    public QRCodeService(QRCodeRepository qrCodeRepository) {
        this.qrCodeRepository = qrCodeRepository;
    }
    
    // Save or update QR code
    public QRCode saveQRCode(QRCode qrCode) {
        return qrCodeRepository.save(qrCode);
    }
    
    // Get all QR codes
    public List<QRCode> getAllQRCodes() {
        return qrCodeRepository.findAll();
    }
    
    // Get QR code by ID
    public Optional<QRCode> getQRCodeById(Integer id) {
        return qrCodeRepository.findById(id);
    }
    
    // Get all active QR codes
    public List<QRCode> getActiveQRCodes() {
        return qrCodeRepository.findByStatus(QRCode.QRCodeStatus.ACTIVE);
    }
    
    // Get QR codes for a mission
    public List<QRCode> getQRCodesByMissionId(Integer missionId) {
        return qrCodeRepository.findByMissionId(missionId);
    }
    
    // Get QR codes for a user
    public List<QRCode> getQRCodesByUserId(Integer userId) {
        return qrCodeRepository.findByUserId(userId);
    }
    
    // Get QR codes for a vehicle
    public List<QRCode> getQRCodesByVehicleId(Integer vehicleId) {
        return qrCodeRepository.findByVehicleId(vehicleId);
    }
    
    // Delete QR code
    public void deleteQRCode(Integer id) {
        qrCodeRepository.deleteById(id);
    }
}





