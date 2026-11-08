package com.projettest.testing.controllers;

import com.projettest.testing.entities.QRCode;
import com.projettest.testing.services.QRCodeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * QRCodeController - Handles HTTP requests for QRCode operations
 * All endpoints start with /api/qrcodes
 */
@RestController
@RequestMapping("/api/qrcodes")
@CrossOrigin(origins = "*")
public class QRCodeController {
    
    private final QRCodeService qrCodeService;
    
    public QRCodeController(QRCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }
    
    /**
     * GET - Get all QR codes
     * Endpoint: GET /api/qrcodes
     */
    @GetMapping
    public ResponseEntity<List<QRCode>> getAllQRCodes() {
        List<QRCode> qrCodes = qrCodeService.getAllQRCodes();
        return ResponseEntity.ok(qrCodes);
    }
    
    /**
     * GET - Get QR code by ID
     * Endpoint: GET /api/qrcodes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<QRCode> getQRCodeById(@PathVariable Integer id) {
        Optional<QRCode> qrCode = qrCodeService.getQRCodeById(id);
        return qrCode.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * POST - Create a new QR code
     * Endpoint: POST /api/qrcodes
     */
    @PostMapping
    public ResponseEntity<QRCode> createQRCode(@RequestBody QRCode qrCode) {
        QRCode savedQRCode = qrCodeService.saveQRCode(qrCode);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQRCode);
    }
    
    /**
     * PUT - Update a QR code
     * Endpoint: PUT /api/qrcodes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<QRCode> updateQRCode(@PathVariable Integer id, @RequestBody QRCode qrCode) {
        Optional<QRCode> existingQRCode = qrCodeService.getQRCodeById(id);
        if (existingQRCode.isPresent()) {
            qrCode.setId(id);
            QRCode updatedQRCode = qrCodeService.saveQRCode(qrCode);
            return ResponseEntity.ok(updatedQRCode);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * DELETE - Delete a QR code
     * Endpoint: DELETE /api/qrcodes/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQRCode(@PathVariable Integer id) {
        if (qrCodeService.getQRCodeById(id).isPresent()) {
            qrCodeService.deleteQRCode(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * GET - Get active QR codes
     * Endpoint: GET /api/qrcodes/status/active
     */
    @GetMapping("/status/active")
    public ResponseEntity<List<QRCode>> getActiveQRCodes() {
        List<QRCode> qrCodes = qrCodeService.getActiveQRCodes();
        return ResponseEntity.ok(qrCodes);
    }
    
    /**
     * GET - Get QR codes for a mission
     * Endpoint: GET /api/qrcodes/mission/{missionId}
     */
    @GetMapping("/mission/{missionId}")
    public ResponseEntity<List<QRCode>> getQRCodesByMissionId(@PathVariable Integer missionId) {
        List<QRCode> qrCodes = qrCodeService.getQRCodesByMissionId(missionId);
        return ResponseEntity.ok(qrCodes);
    }
}





