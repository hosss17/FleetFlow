package com.projettest.testing.controllers;

import com.projettest.testing.entities.Mission;
import com.projettest.testing.entities.User;
import com.projettest.testing.services.MissionService;
import com.projettest.testing.services.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {
    
    private final MissionService missionService;
    private final NotificationService notificationService;
    
    public MissionController(MissionService missionService, NotificationService notificationService) {
        this.missionService = missionService;
        this.notificationService = notificationService;
    }
    
    /**
     * GET - Get all missions
     */
    @GetMapping
    public ResponseEntity<List<Mission>> getAllMissions() {
        List<Mission> missions = missionService.getAllMissions();
        return ResponseEntity.ok(missions);
    }
    
    /**
     * GET - Get mission by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Mission> getMissionById(@PathVariable Integer id) {
        Optional<Mission> mission = missionService.getMissionById(id);
        return mission.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * POST - Create a new mission
     */
    @PostMapping
    public ResponseEntity<Mission> createMission(@RequestBody Mission mission) {
        try {
            Mission savedMission = missionService.saveMission(mission);

            User actor = savedMission.getUser();
            if (actor != null && actor.getRole() == User.UserRole.EMPLOYE) {
                String missionTitle = savedMission.getTitle() == null || savedMission.getTitle().isBlank()
                    ? "Mission sans titre"
                    : savedMission.getTitle();
                String startDate = savedMission.getStartDatetime() == null
                    ? "date inconnue"
                    : savedMission.getStartDatetime().toLocalDate().toString();

                notificationService.notifyResponsables(
                    "MISSION_DEMANDEE",
                    String.format("%s a soumis une mission: %s (depart %s).", actor.getName(), missionTitle, startDate),
                    savedMission
                );
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(savedMission);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * PUT - Update a mission
     */
    @PutMapping("/{id}")
    public ResponseEntity<Mission> updateMission(@PathVariable Integer id, @RequestBody Mission mission) {
        Optional<Mission> existingMission = missionService.getMissionById(id);
        if (existingMission.isPresent()) {
            mission.setId(id);
            try {
                Mission updatedMission = missionService.saveMission(mission);
                return ResponseEntity.ok(updatedMission);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * DELETE - Delete a mission
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMission(@PathVariable Integer id) {
        if (missionService.getMissionById(id).isPresent()) {
            missionService.deleteMission(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * GET - Get missions for a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Mission>> getMissionsByUserId(@PathVariable Integer userId) {
        List<Mission> missions = missionService.getMissionsByUserId(userId);
        return ResponseEntity.ok(missions);
    }
    
    /**
     * GET - Get pending missions
     */
    @GetMapping("/status/pending")
    public ResponseEntity<List<Mission>> getPendingMissions() {
        List<Mission> missions = missionService.getPendingMissions();
        return ResponseEntity.ok(missions);
    }
    
    /**
     * GET - Get approved missions
     */
    @GetMapping("/status/approved")
    public ResponseEntity<List<Mission>> getApprovedMissions() {
        List<Mission> missions = missionService.getApprovedMissions();
        return ResponseEntity.ok(missions);
    }
    
    
    /**
     * GET - Get urgent missions
     */
    @GetMapping("/priority/urgent")
    public ResponseEntity<List<Mission>> getUrgentMissions() {
        List<Mission> missions = missionService.getUrgentMissions();
        return ResponseEntity.ok(missions);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Mission> approveMission(@PathVariable Integer id, @RequestBody ApproveMissionRequest request) {
        Integer vehicleId = request == null ? null : request.vehicleId();
        return missionService.approveMission(id, vehicleId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.badRequest().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Mission> rejectMission(@PathVariable Integer id) {
        return missionService.rejectMission(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/outcome")
    public ResponseEntity<Mission> setMissionOutcome(@PathVariable Integer id, @RequestBody MissionOutcomeRequest request) {
        if (request == null || request.status() == null) {
            return ResponseEntity.badRequest().build();
        }

        return missionService.setMissionOutcome(id, request.status())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.badRequest().build());
    }

    public record ApproveMissionRequest(Integer vehicleId) {}

    public record MissionOutcomeRequest(Mission.MissionStatus status) {}
}



