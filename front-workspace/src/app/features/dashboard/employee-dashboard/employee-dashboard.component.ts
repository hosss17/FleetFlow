import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AppUser,
  ProblemReport
} from '../../../core/models/logistics.models';
import { MissionApiService, MissionRequestView } from '../../../core/services/mission-api.service';
import { IncidentApiService } from '../../../core/services/incident-api.service';
import { UserApiService } from '../../../core/services/user-api.service';

interface EmployeeSummary {
  label: string;
  value: number;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css'],
})
export class EmployeeDashboardComponent {
  employee: AppUser;
  readonly todayIso = new Date().toISOString().slice(0, 10);
  summaries: EmployeeSummary[] = [];
  missions: MissionRequestView[] = [];
  reports: ProblemReport[] = [];
  infoMessage = '';
  missionFormError = '';
  missionFormTouched = false;
  showMissionComposer = false;
  selectedQrMissionId: string | null = null;
  private readonly updatingMissionIds = new Set<string>();

  missionForm = {
    destination: '',
    objective: '',
    startDate: '',
    endDate: '',
    priority: 'NORMAL' as 'URGENT' | 'NORMAL',
    needsVehicle: false
  };

  problemForm = {
    category: 'PARKING' as ProblemReport['category'],
    severity: 'MOYENNE' as ProblemReport['severity'],
    description: ''
  };

  constructor(
    private readonly missionApiService: MissionApiService,
    private readonly incidentApiService: IncidentApiService,
    private readonly userApiService: UserApiService,
    private readonly route: ActivatedRoute
  ) {
    const currentUserId = localStorage.getItem('currentUserId') ?? '';
    this.employee = {
      id: currentUserId,
      name: 'Employe',
      email: '',
      role: 'employee',
      active: true
    };

    const parsedUserId = Number.parseInt(currentUserId, 10);
    if (Number.isFinite(parsedUserId)) {
      this.userApiService.getUserById(parsedUserId).subscribe({
        next: (user) => {
          this.employee = {
            ...this.employee,
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active
          };
        }
      });
    }

    this.route.fragment.subscribe((fragment) => {
      this.showMissionComposer = fragment === 'create-mission';

      if (fragment && fragment !== 'create-mission') {
        this.scrollToSection(fragment);
      }
    });
    this.reloadData();
  }

  private scrollToSection(sectionId: string): void {
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  reloadData(): void {
    const userId = Number.parseInt(this.employee.id, 10);
    if (!Number.isFinite(userId)) {
      this.infoMessage = 'Utilisateur non connecte.';
      this.missions = [];
      this.reports = [];
      return;
    }

    forkJoin({
      missions: this.missionApiService.getMissionViewsByUserId(userId),
      reports: this.incidentApiService.getReportsByUserId(userId)
    }).subscribe({
      next: ({ missions, reports }) => {
        this.missions = missions;
        this.reports = reports;
        this.refreshSummaries();
      },
      error: () => {
        this.infoMessage = 'Chargement des donnees impossible.';
      }
    });
  }

  private refreshSummaries(): void {
    const approvedWithQrMissions = this.missions.filter((mission) => {
      const hasQr = !!mission.qrCodeDataUrl;
      const isValidatedMission =
        mission.status === 'APPROUVEE' ||
        mission.status === 'TERMINEE' ||
        mission.status === 'ECHOUEE';

      return hasQr && isValidatedMission;
    }).length;
    this.summaries = [
      { label: 'Mes missions', value: this.missions.length, color: '#003366', icon: 'fas fa-road' },
      { label: 'En attente', value: this.missions.filter((mission) => mission.status === 'EN_ATTENTE').length, color: '#f39c12', icon: 'fas fa-hourglass-half' },
      { label: 'Approuvees + QR', value: approvedWithQrMissions, color: '#27ae60', icon: 'fas fa-qrcode' },
      { label: 'Missions terminees', value: this.missions.filter((mission) => mission.status === 'TERMINEE').length, color: '#475569', icon: 'fas fa-circle-check' }
    ];
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

    const userId = Number.parseInt(this.employee.id, 10);
    if (!Number.isFinite(userId)) {
      this.missionFormError = 'Utilisateur non connecté.';
      return;
    }

    this.missionApiService.createMissionRequest({
      employeeId: userId,
      destination: this.missionForm.destination,
      objective: this.missionForm.objective,
      startDate: this.missionForm.startDate,
      endDate: this.missionForm.endDate,
      priority: this.missionForm.priority,
      needsVehicle: this.missionForm.needsVehicle
    }).subscribe({
      next: () => {
        this.resetMissionForm();
        this.missionFormError = '';
        this.missionFormTouched = false;
        this.infoMessage = 'Demande de mission envoyee. En attente de validation du responsable.';
        
        
        this.reloadData();
      },
      error: () => {
        this.missionFormError = 'Creation de mission impossible.';
      }
    });
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

  submitProblemReport(): void {
    if (!this.problemForm.description) {
      this.infoMessage = 'Veuillez decrire le probleme avant envoi.';
      return;
    }

    const userId = Number.parseInt(this.employee.id, 10);
    if (!Number.isFinite(userId)) {
      this.infoMessage = 'Utilisateur non connecte.';
      return;
    }

    this.incidentApiService.createReport({
      userId,
      category: this.problemForm.category,
      severity: this.problemForm.severity,
      description: this.problemForm.description
    }).subscribe({
      next: () => {
        this.problemForm = {
          category: 'PARKING',
          severity: 'MOYENNE',
          description: ''
        };

        this.infoMessage = 'Incident signale au service logistique.';
        this.reloadData();
      },
      error: () => {
        this.infoMessage = 'Signalement impossible.';
      }
    });
  }

  openQrModal(missionId: string): void {
    this.selectedQrMissionId = missionId;
  }

  canSetMissionOutcome(mission: MissionRequestView): boolean {
    return mission.status === 'APPROUVEE' || mission.status === 'TERMINEE' || mission.status === 'ECHOUEE';
  }

  isMissionUpdating(missionId: string): boolean {
    return this.updatingMissionIds.has(missionId);
  }

  markMissionAsTerminee(missionId: string): void {
    this.updateMissionOutcome(missionId, 'TERMINEE');
  }

  markMissionAsEchouee(missionId: string): void {
    this.updateMissionOutcome(missionId, 'ECHOUEE');
  }

  private updateMissionOutcome(missionId: string, status: 'TERMINEE' | 'ECHOUEE'): void {
    const missionNumber = Number.parseInt(missionId, 10);
    if (!Number.isFinite(missionNumber) || this.updatingMissionIds.has(missionId)) {
      return;
    }

    this.updatingMissionIds.add(missionId);
    this.missionApiService.setMissionOutcome(missionNumber, status).subscribe({
      next: (updatedMission) => {
        this.missions = this.missions.map((mission) => (mission.id === missionId ? updatedMission : mission));
        this.refreshSummaries();
        this.infoMessage = status === 'TERMINEE'
          ? `Mission ${missionId} marquee comme terminee.`
          : `Mission ${missionId} marquee comme echouee.`;
        this.updatingMissionIds.delete(missionId);
      },
      error: () => {
        this.infoMessage = 'Mise a jour du statut de mission impossible.';
        this.updatingMissionIds.delete(missionId);
      }
    });
  }

  closeQrModal(): void {
    this.selectedQrMissionId = null;
  }

  selectedQrMission(): MissionRequestView | undefined {
    return this.missions.find((mission) => mission.id === this.selectedQrMissionId);
  }

  formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  statusChip(status: string): string {
    return {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      TERMINEE: 'bg-emerald-100 text-emerald-800',
      ECHOUEE: 'bg-slate-100 text-slate-800',
      REFUSEE: 'bg-red-100 text-red-800',
      OUVERT: 'bg-red-100 text-red-800',
      APPROUVEE: 'bg-emerald-100 text-emerald-800',
      EN_COURS_REPORT: 'bg-orange-100 text-orange-800',
      RESOLU: 'bg-zinc-200 text-zinc-700'
    }[status] ?? 'bg-gray-100 text-gray-700';
  }
}
