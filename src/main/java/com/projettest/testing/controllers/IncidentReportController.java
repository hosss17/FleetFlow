package com.projettest.testing.controllers;

import com.projettest.testing.entities.IncidentReport;
import com.projettest.testing.entities.User;
import com.projettest.testing.entities.Vehicle;
import com.projettest.testing.repositories.VehicleRepository;
import com.projettest.testing.services.IncidentReportService;
import com.projettest.testing.services.NotificationService;
import com.projettest.testing.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
public class IncidentReportController {

    private final IncidentReportService incidentReportService;
    private final UserService userService;
    private final VehicleRepository vehicleRepository;
    private final NotificationService notificationService;

    public IncidentReportController(
        IncidentReportService incidentReportService,
        UserService userService,
        VehicleRepository vehicleRepository,
        NotificationService notificationService
    ) {
        this.incidentReportService = incidentReportService;
        this.userService = userService;
        this.vehicleRepository = vehicleRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<IncidentReport>> getAllReports() {
        return ResponseEntity.ok(incidentReportService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentReport> getReportById(@PathVariable Integer id) {
        return incidentReportService.getById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<IncidentReport> createReport(@RequestBody IncidentReportRequest request) {
        Optional<User> user = userService.getUserById(request.userId());
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        IncidentReport report = new IncidentReport();
        report.setUser(user.get());
        report.setCategory(request.category());
        report.setSeverity(request.severity());
        report.setDescription(request.description());
        report.setStatus(IncidentReport.IncidentStatus.OUVERT);

        if (request.vehicleId() != null) {
            Optional<Vehicle> vehicle = vehicleRepository.findById(request.vehicleId());
            vehicle.ifPresent(report::setVehicle);
        }

        IncidentReport created = incidentReportService.save(report);

        if (created.getUser() != null && created.getUser().getRole() == User.UserRole.EMPLOYE) {
            notificationService.notifyResponsables(
                "INCIDENT_SIGNALE",
                String.format(
                    "%s a signale un incident %s (niveau %s).",
                    created.getUser().getName(),
                    created.getCategory(),
                    created.getSeverity()
                ),
                null
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Integer id) {
        if (incidentReportService.getById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        incidentReportService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<IncidentReport>> getReportsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(incidentReportService.getByUserId(userId));
    }

    @GetMapping("/status/open")
    public ResponseEntity<List<IncidentReport>> getOpenReports() {
        return ResponseEntity.ok(incidentReportService.getOpenReports());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<IncidentReport> updateStatus(
        @PathVariable Integer id,
        @RequestBody UpdateIncidentStatusRequest request
    ) {
        if (request == null || request.status() == null) {
            return ResponseEntity.badRequest().build();
        }

        return incidentReportService.updateStatus(id, request.status())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record IncidentReportRequest(
        Integer userId,
        Integer vehicleId,
        IncidentReport.IncidentCategory category,
        IncidentReport.Severity severity,
        String description
    ) {}

    public record UpdateIncidentStatusRequest(IncidentReport.IncidentStatus status) {}
}
