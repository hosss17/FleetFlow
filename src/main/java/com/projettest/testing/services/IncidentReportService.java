package com.projettest.testing.services;

import com.projettest.testing.entities.IncidentReport;
import com.projettest.testing.repositories.IncidentReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IncidentReportService {

    private final IncidentReportRepository incidentReportRepository;

    public IncidentReportService(IncidentReportRepository incidentReportRepository) {
        this.incidentReportRepository = incidentReportRepository;
    }

    public IncidentReport save(IncidentReport report) {
        return incidentReportRepository.save(report);
    }

    public List<IncidentReport> getAll() {
        return incidentReportRepository.findAll();
    }

    public Optional<IncidentReport> getById(Integer id) {
        return incidentReportRepository.findById(id);
    }

    public List<IncidentReport> getByUserId(Integer userId) {
        return incidentReportRepository.findByUserId(userId);
    }

    public List<IncidentReport> getOpenReports() {
        return incidentReportRepository.findByStatus(IncidentReport.IncidentStatus.OUVERT);
    }

    public Optional<IncidentReport> updateStatus(Integer id, IncidentReport.IncidentStatus status) {
        Optional<IncidentReport> report = incidentReportRepository.findById(id);
        if (report.isEmpty()) {
            return Optional.empty();
        }

        IncidentReport current = report.get();
        current.setStatus(status);
        return Optional.of(incidentReportRepository.save(current));
    }

    public void delete(Integer id) {
        incidentReportRepository.deleteById(id);
    }
}
