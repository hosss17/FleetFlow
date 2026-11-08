package com.projettest.testing.services;

import com.projettest.testing.entities.VehicleReservation;
import com.projettest.testing.repositories.VehicleReservationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VehicleReservationService {

    private final VehicleReservationRepository reservationRepository;

    public VehicleReservationService(VehicleReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public VehicleReservation save(VehicleReservation reservation) {
        return reservationRepository.save(reservation);
    }

    public List<VehicleReservation> getAll() {
        return reservationRepository.findAll();
    }

    public Optional<VehicleReservation> getById(Integer id) {
        return reservationRepository.findById(id);
    }

    public List<VehicleReservation> getByUserId(Integer userId) {
        return reservationRepository.findByUserId(userId);
    }

    public List<VehicleReservation> getPending() {
        return reservationRepository.findByStatus(VehicleReservation.ReservationStatus.EN_ATTENTE);
    }

    public Optional<VehicleReservation> approve(Integer id) {
        Optional<VehicleReservation> reservation = reservationRepository.findById(id);
        if (reservation.isEmpty()) {
            return Optional.empty();
        }

        VehicleReservation current = reservation.get();
        current.setStatus(VehicleReservation.ReservationStatus.APPROUVEE);
        return Optional.of(reservationRepository.save(current));
    }

    public Optional<VehicleReservation> reject(Integer id) {
        Optional<VehicleReservation> reservation = reservationRepository.findById(id);
        if (reservation.isEmpty()) {
            return Optional.empty();
        }

        VehicleReservation current = reservation.get();
        current.setStatus(VehicleReservation.ReservationStatus.REFUSEE);
        return Optional.of(reservationRepository.save(current));
    }

    public void delete(Integer id) {
        reservationRepository.deleteById(id);
    }
}
