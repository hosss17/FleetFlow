package com.projettest.testing.services;

import com.projettest.testing.entities.Mission;
import com.projettest.testing.entities.Notification;
import com.projettest.testing.entities.QRCode;
import com.projettest.testing.entities.User;
import com.projettest.testing.entities.Vehicle;
import com.projettest.testing.repositories.MissionRepository;
import com.projettest.testing.repositories.UserRepository;
import com.projettest.testing.repositories.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * MissionService - Handles business logic for Mission operations
 */
@Service
public class MissionService {
    
    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final QRCodeService qrCodeService;
    private final NotificationService notificationService;
    
    public MissionService(
        MissionRepository missionRepository,
        UserRepository userRepository,
        VehicleRepository vehicleRepository,
        QRCodeService qrCodeService,
        NotificationService notificationService
    ) {
        this.missionRepository = missionRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.qrCodeService = qrCodeService;
        this.notificationService = notificationService;
    }
    
    // Save or update a mission
    public Mission saveMission(Mission mission) {
        if (mission.getUser() == null || mission.getUser().getId() == null) {
            throw new IllegalArgumentException("Mission must reference an existing user");
        }

        validateMissionTextField(mission.getTitle(), "Destination");
        validateMissionTextField(mission.getDescription(), "Description");

        User user = userRepository.findById(mission.getUser().getId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (mission.getId() == null && user.getRole() != User.UserRole.EMPLOYE) {
            throw new IllegalArgumentException("Only EMPLOYE users can create missions");
        }

        mission.setUser(user);

        if (mission.getVehicle() != null && mission.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(mission.getVehicle().getId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
            mission.setVehicle(vehicle);
        } else {
            mission.setVehicle(null);
        }

        return missionRepository.save(mission);
    }

    private void validateMissionTextField(String value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }

        boolean containsLetter = normalized.chars().anyMatch(Character::isLetter);
        boolean containsDigit = normalized.chars().anyMatch(Character::isDigit);
        if (!containsLetter || containsDigit) {
            throw new IllegalArgumentException(fieldName + " must contain letters and must not contain numbers");
        }
    }
    
    // Get all missions
    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }
    
    // Get mission by ID
    public Optional<Mission> getMissionById(Integer id) {
        return missionRepository.findById(id);
    }
    
    // Get all missions for a user
    public List<Mission> getMissionsByUserId(Integer userId) {
        return missionRepository.findByUserId(userId);
    }
    
    // Get all pending missions
    public List<Mission> getPendingMissions() {
        return missionRepository.findByStatus(Mission.MissionStatus.EN_ATTENTE);
    }

    // Get pending missions for a specific user
    public List<Mission> getPendingMissionsByUserId(Integer userId) {
        return missionRepository.findByUserIdAndStatus(userId, Mission.MissionStatus.EN_ATTENTE);
    }
    
    // Get all approved missions
    public List<Mission> getApprovedMissions() {
        return missionRepository.findByStatus(Mission.MissionStatus.APPROUVEE);
    }
    
    
    // Get all completed missions
    public List<Mission> getCompletedMissions() {
        return missionRepository.findByStatus(Mission.MissionStatus.TERMINEE);
    }
    
    // Get all urgent missions
    public List<Mission> getUrgentMissions() {
        return missionRepository.findByPriority(Mission.MissionPriority.URGENT);
    }
    
    // Get all missions for a vehicle
    public List<Mission> getMissionsByVehicleId(Integer vehicleId) {
        return missionRepository.findByVehicleId(vehicleId);
    }
    
    // Delete mission
    public void deleteMission(Integer id) {
        missionRepository.deleteById(id);
    }

    public Optional<Mission> approveMission(Integer missionId, Integer vehicleId) {
        Optional<Mission> missionOpt = missionRepository.findById(missionId);
        if (missionOpt.isEmpty()) {
            return Optional.empty();
        }

        Mission mission = missionOpt.get();
        mission.setStatus(Mission.MissionStatus.APPROUVEE);

        if (Boolean.TRUE.equals(mission.getNeedsVehicle())) {
            if (vehicleId == null) {
                return Optional.empty();
            }

            Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);
            if (vehicleOpt.isEmpty()) {
                return Optional.empty();
            }

            Vehicle vehicle = vehicleOpt.get();
            if (vehicle.getStatus() != Vehicle.VehicleStatus.DISPONIBLE) {
                return Optional.empty();
            }

            mission.setVehicle(vehicle);
            vehicle.setStatus(Vehicle.VehicleStatus.RESERVE);
            vehicleRepository.save(vehicle);

            QRCode qrCode = new QRCode();
            qrCode.setMission(mission);
            qrCode.setUser(mission.getUser());
            qrCode.setVehicle(vehicle);
            qrCode.setStatus(QRCode.QRCodeStatus.ACTIVE);
            qrCode.setValidFrom(LocalDateTime.now());
            qrCode.setValidTo(mission.getEndDatetime());
            qrCodeService.saveQRCode(qrCode);
        }

        Mission updated = missionRepository.save(mission);
        createMissionNotification(
            mission.getUser(),
            updated,
            "MISSION_APPROUVEE",
            "Votre mission a ete approuvee par le responsable."
        );
        return Optional.of(updated);
    }

    public Optional<Mission> rejectMission(Integer missionId) {
        Optional<Mission> missionOpt = missionRepository.findById(missionId);
        if (missionOpt.isEmpty()) {
            return Optional.empty();
        }

        Mission mission = missionOpt.get();
        mission.setStatus(Mission.MissionStatus.REFUSEE);

        if (mission.getVehicle() != null) {
            Vehicle vehicle = mission.getVehicle();
            if (vehicle.getStatus() == Vehicle.VehicleStatus.RESERVE) {
                vehicle.setStatus(Vehicle.VehicleStatus.DISPONIBLE);
                vehicleRepository.save(vehicle);
            }
            mission.setVehicle(null);
        }

        Mission updated = missionRepository.save(mission);
        createMissionNotification(
            mission.getUser(),
            updated,
            "MISSION_REFUSEE",
            "Votre demande de mission a ete refusee."
        );
        return Optional.of(updated);
    }

    public Optional<Mission> setMissionOutcome(Integer missionId, Mission.MissionStatus status) {
        Optional<Mission> missionOpt = missionRepository.findById(missionId);
        if (missionOpt.isEmpty()) {
            return Optional.empty();
        }

        if (status != Mission.MissionStatus.TERMINEE && status != Mission.MissionStatus.ECHOUEE) {
            return Optional.empty();
        }

        Mission mission = missionOpt.get();
        mission.setStatus(status);

        return Optional.of(missionRepository.save(mission));
    }

    private void createMissionNotification(User user, Mission mission, String type, String message) {
        if (user == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMission(mission);
        notification.setType(type);
        notification.setMessage(message);
        notification.setReadStatus(Notification.NotificationStatus.NON_LU);
        notificationService.saveNotification(notification);
    }
}





