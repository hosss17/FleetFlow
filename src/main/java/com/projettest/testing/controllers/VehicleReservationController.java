package com.projettest.testing.controllers;

import com.projettest.testing.entities.User;
import com.projettest.testing.entities.VehicleReservation;
import com.projettest.testing.services.NotificationService;
import com.projettest.testing.services.UserService;
import com.projettest.testing.services.VehicleReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class VehicleReservationController {

    private final VehicleReservationService reservationService;
    private final UserService userService;
    private final NotificationService notificationService;

    public VehicleReservationController(
        VehicleReservationService reservationService,
        UserService userService,
        NotificationService notificationService
    ) {
        this.reservationService = reservationService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleReservation>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleReservation> getReservationById(@PathVariable Integer id) {
        return reservationService.getById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<VehicleReservation> createReservation(@RequestBody VehicleReservationRequest request) {
        Optional<User> user = userService.getUserById(request.userId());
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        VehicleReservation reservation = new VehicleReservation();
        reservation.setUser(user.get());
        reservation.setRequestedType(request.requestedType());
        reservation.setFromDate(request.fromDate());
        reservation.setToDate(request.toDate());
        reservation.setReason(request.reason());
        reservation.setStatus(VehicleReservation.ReservationStatus.EN_ATTENTE);

        VehicleReservation created = reservationService.save(reservation);

        if (created.getUser() != null && created.getUser().getRole() == User.UserRole.EMPLOYE) {
            notificationService.notifyResponsables(
                "RESERVATION_DEMANDEE",
                String.format(
                    "%s demande une reservation %s du %s au %s.",
                    created.getUser().getName(),
                    created.getRequestedType(),
                    created.getFromDate(),
                    created.getToDate()
                ),
                null
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Integer id) {
        if (reservationService.getById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        reservationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<VehicleReservation>> getReservationsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(reservationService.getByUserId(userId));
    }

    @GetMapping("/status/pending")
    public ResponseEntity<List<VehicleReservation>> getPendingReservations() {
        return ResponseEntity.ok(reservationService.getPending());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<VehicleReservation> approveReservation(@PathVariable Integer id) {
        return reservationService.approve(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<VehicleReservation> rejectReservation(@PathVariable Integer id) {
        return reservationService.reject(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record VehicleReservationRequest(
        Integer userId,
        VehicleReservation.VehicleType requestedType,
        java.time.LocalDate fromDate,
        java.time.LocalDate toDate,
        String reason
    ) {}
}
