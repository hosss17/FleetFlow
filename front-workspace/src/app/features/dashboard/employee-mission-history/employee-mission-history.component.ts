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
  selector: 'app-employee-mission-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-mission-history.component.html',
  styleUrls: ['./employee-mission-history.component.css']
})
export class EmployeeMissionHistoryComponent {
  missions: MissionRequestView[] = [];
  reservations: VehicleReservation[] = [];
  reports: ProblemReport[] = [];
  selectedMissionId: string | null = null;
  searchTerm = '';
  activeFilter: MissionRequestView['status'] | 'ALL' = 'ALL';
  infoMessage = '';
  readonly todayIso = new Date().toISOString().slice(0, 10);
  showMissionComposer = false;
  missionFormError = '';
  missionFormTouched = false;

  missionForm = {
    destination: '',
    objective: '',
    startDate: '',
    endDate: '',
    priority: 'NORMAL' as 'URGENT' | 'NORMAL',
    needsVehicle: false
  };

  constructor(
    private readonly missionApiService: MissionApiService,
    private readonly reservationApiService: ReservationApiService,
    private readonly incidentApiService: IncidentApiService
  ) {
    this.reloadData();
  }

  reloadData(): void {
    const currentUserId = Number.parseInt(localStorage.getItem('currentUserId') ?? '', 10);
    if (!Number.isFinite(currentUserId)) {
      this.infoMessage = 'Utilisateur non connecte.';
      this.missions = [];
      this.reservations = [];
      this.reports = [];
      return;
    }

    forkJoin({
      missions: this.missionApiService.getMissionViewsByUserId(currentUserId),
      reservations: this.reservationApiService.getReservationsByUserId(currentUserId),
      reports: this.incidentApiService.getReportsByUserId(currentUserId)
    }).subscribe({
      next: ({ missions, reservations, reports }) => {
        this.infoMessage = '';
        this.missions = missions;
        this.reservations = reservations;
        this.reports = reports;

        if (this.missions.length > 0) {
          const stillExists = this.missions.some((mission) => mission.id === this.selectedMissionId);
          if (!stillExists) {
            this.selectedMissionId = this.missions[0].id;
          }
        } else {
          this.selectedMissionId = null;
        }
      },
      error: () => {
        this.infoMessage = 'Chargement de l\'historique impossible.';
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
        || mission.destination.toLowerCase().includes(query)
        || mission.objective.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }

  selectMission(missionId: string): void {
    this.selectedMissionId = missionId;
  }

  toggleMissionComposer(): void {
    this.showMissionComposer = !this.showMissionComposer;
  }

  closeMissionComposer(): void {
    this.showMissionComposer = false;
    this.resetMissionForm();
    this.missionFormError = '';
    this.missionFormTouched = false;
  }

  submitMissionRequest(): void {
    this.missionFormTouched = true;
    this.missionFormError = '';

    const missingFields: string[] = [];
    if (!this.missionForm.destination.trim()) {
      missingFields.push('Destination');
    }
    if (!this.missionForm.startDate) {
      missingFields.push('Date de debut');
    }
    if (!this.missionForm.endDate) {
      missingFields.push('Date de fin');
    }
    if (!this.missionForm.objective.trim()) {
      missingFields.push('Objectif de la mission');
    }

    if (missingFields.length > 0) {
      this.missionFormError = `Champs obligatoires: ${missingFields.join(', ')}.`;
      return;
    }

    if (this.missionForm.startDate < this.todayIso || this.missionForm.endDate < this.todayIso) {
      this.missionFormError = 'La date de mission ne peut pas etre dans le passe.';
      return;
    }

    if (this.missionForm.endDate < this.missionForm.startDate) {
      this.missionFormError = 'La date de fin doit etre superieure ou egale a la date de debut.';
      return;
    }

    const currentUserId = Number.parseInt(localStorage.getItem('currentUserId') ?? '', 10);
    if (!Number.isFinite(currentUserId)) {
      this.missionFormError = 'Utilisateur non connecte.';
      return;
    }

    this.missionApiService.createMissionRequest({
      employeeId: currentUserId,
      destination: this.missionForm.destination,
      objective: this.missionForm.objective,
      startDate: this.missionForm.startDate,
      endDate: this.missionForm.endDate,
      priority: this.missionForm.priority,
      needsVehicle: this.missionForm.needsVehicle
    }).subscribe({
      next: () => {
        this.closeMissionComposer();
        this.infoMessage = 'Demande de mission envoyee. En attente de validation du responsable.';
        this.reloadData();
      },
      error: () => {
        this.missionFormError = 'Creation de mission impossible.';
      }
    });
  }

  private resetMissionForm(): void {
    this.missionForm = {
      destination: '',
      objective: '',
      startDate: '',
      endDate: '',
      priority: 'NORMAL',
      needsVehicle: false
    };
  }

  private isMissionTextValid(value: string): boolean {
    const normalized = value.trim();
    return normalized.length > 0 && /[A-Za-zÀ-ÿ]/.test(normalized) && !/\d/.test(normalized);
  }

  isMissionDestinationValid(): boolean {
    return this.isMissionTextValid(this.missionForm.destination);
  }

  isMissionObjectiveValid(): boolean {
    return this.isMissionTextValid(this.missionForm.objective);
  }

  canSubmitMissionRequest(): boolean {
    return !!(
      this.missionForm.destination.trim()
      && this.missionForm.objective.trim()
      && this.isMissionDestinationValid()
      && this.isMissionObjectiveValid()
      && this.missionForm.startDate
      && this.missionForm.endDate
      && this.missionForm.endDate >= this.missionForm.startDate
      && this.missionForm.priority
    );
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
      reservation.fromDate <= mission.endDate
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
      ECHOUEE: 'status-chip failed',
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
