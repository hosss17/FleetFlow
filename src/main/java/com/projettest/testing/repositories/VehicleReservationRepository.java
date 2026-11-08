package com.projettest.testing.repositories;

import com.projettest.testing.entities.VehicleReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleReservationRepository extends JpaRepository<VehicleReservation, Integer> {

    List<VehicleReservation> findByUserId(Integer userId);

    List<VehicleReservation> findByStatus(VehicleReservation.ReservationStatus status);
}
