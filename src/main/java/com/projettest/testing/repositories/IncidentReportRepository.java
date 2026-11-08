package com.projettest.testing.repositories;

import com.projettest.testing.entities.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Integer> {

    List<IncidentReport> findByUserId(Integer userId);

    List<IncidentReport> findByStatus(IncidentReport.IncidentStatus status);

    List<IncidentReport> findByVehicleId(Integer vehicleId);
}
