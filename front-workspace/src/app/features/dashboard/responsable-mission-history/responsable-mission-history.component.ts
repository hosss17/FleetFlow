import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ProblemReport,
  VehicleReservation
} from '../../../core/models/logistics.models';
import { MissionApiService, MissionRequestView } from '../../../core/services/mission-api.service';
import { ReservationApiService } from '../../../core/services/reservation-api.service';
import { IncidentApiService } from '../../../core/services/incident-api.service';

@Component({
  selector: 'app-responsable-mission-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './responsable-mission-history.component.html',
  styleUrls: ['./responsable-mission-history.component.css']
})
export class ResponsableMissionHistoryComponent {
  missions: MissionRequestView[] = [];
  reservations: VehicleReservation[] = [];
  reports: ProblemReport[] = [];
  selectedMissionId: string | null = null;
  searchTerm = '';
  activeFilter: MissionRequestView['status'] | 'ALL' = 'ALL';

  constructor(
    private readonly missionApiService: MissionApiService,
    private readonly reservationApiService: ReservationApiService,
    private readonly incidentApiService: IncidentApiService
  ) {
    this.reloadData();
  }

  reloadData(): void {
    forkJoin({
      missions: this.missionApiService.getAllMissionViews(),
      reservations: this.reservationApiService.getAllReservations(),
      reports: this.incidentApiService.getAllReports()
    }).subscribe({
      next: ({ missions, reservations, reports }) => {
        this.missions = missions;
        this.reservations = reservations;
        this.reports = reports;

        if (this.missions.length > 0 && !this.selectedMissionId) {
          this.selectedMissionId = this.missions[0].id;
        }
      }
    });
  }

  filteredMissions(): MissionRequestView[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.missions.filter((mission) => {
      const matchesStatus = this.activeFilter === 'ALL' || mission.status === this.activeFilter;
      const matchesQuery =
        query.length === 0
        || mission.id.toLowerCase().includes(query)
        || mission.employee.name.toLowerCase().includes(query)
        || mission.destination.toLowerCase().includes(query)
        || mission.objective.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }

  selectMission(missionId: string): void {
    this.selectedMissionId = missionId;
  }

  selectedMission(): MissionRequestView | undefined {
    return this.missions.find((mission) => mission.id === this.selectedMissionId);
  }

  pendingMissionsCount(): number {
    return this.missions.filter((mission) => mission.status === 'EN_ATTENTE').length;
  }

  completedMissionsCount(): number {
    return this.missions.filter((mission) => mission.status === 'TERMINEE').length;
  }

  missionReservations(mission: MissionRequestView): VehicleReservation[] {
    return this.reservations.filter((reservation) =>
      reservation.employee.id === mission.employee.id
      && reservation.fromDate <= mission.endDate
      && reservation.toDate >= mission.startDate
    );
  }

  missionReports(mission: MissionRequestView): ProblemReport[] {
    return this.reports.filter((report) =>
      report.employee.id === mission.employee.id
      || (!!mission.assignedVehicleId && report.relatedVehicleId === mission.assignedVehicleId)
    );
  }

  statusChip(status: string): string {
    return {
      EN_ATTENTE: 'status-chip pending',
      APPROUVEE: 'status-chip approved',
      TERMINEE: 'status-chip done',
      ECHOUEE: 'status-chip rejected',
      REFUSEE: 'status-chip rejected'
    }[status] ?? 'status-chip';
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
