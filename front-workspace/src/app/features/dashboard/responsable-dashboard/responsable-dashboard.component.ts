import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AppUser,
  ProblemReport,
  Vehicle,
  VehicleReservation,
  VehicleStatus
} from '../../../core/models/logistics.models';
import { UserApiService } from '../../../core/services/user-api.service';
import { VehicleApiService } from '../../../core/services/vehicle-api.service';
import { MissionApiService, MissionRequestView } from '../../../core/services/mission-api.service';
import { ReservationApiService } from '../../../core/services/reservation-api.service';
import { IncidentApiService } from '../../../core/services/incident-api.service';

interface Kpi {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface UserIdentity {
  id: string;
  email: string;
}

@Component({
  selector: 'app-responsable-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './responsable-dashboard.component.html',
  styleUrls: ['./responsable-dashboard.component.css'],
})
export class ResponsableDashboardComponent implements AfterViewInit {
  kpis: Kpi[] = [];
  missions: MissionRequestView[] = [];
  reservations: VehicleReservation[] = [];
  vehicles: Vehicle[] = [];
  users: AppUser[] = [];
  reports: ProblemReport[] = [];
  selectedVehicleByMission: Record<string, string> = {};
  showRejectionModal = false;
  rejectionReason = '';
  missionToReject: string | null = null;
  flashMessage = '';
  private readonly updatingVehicleIds = new Set<string>();
  private readonly deletingUserIds = new Set<string>();
  private readonly togglingUserIds = new Set<string>();
  private readonly pendingToggleClicksByUserId = new Map<string, number>();
  private pendingFragment: string | null = null;

  constructor(
    private readonly missionApiService: MissionApiService,
    private readonly reservationApiService: ReservationApiService,
    private readonly incidentApiService: IncidentApiService,
    private readonly userApiService: UserApiService,
    private readonly vehicleApiService: VehicleApiService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        this.pendingFragment = fragment;
        this.scrollToSection(fragment);
      }
    });

    this.reloadData();
  }

  ngAfterViewInit(): void {
    if (this.pendingFragment) {
      this.scrollToSection(this.pendingFragment);
    }
  }

  private scrollToSection(sectionId: string): void {
    this.tryScrollToSection(sectionId, 10);
  }

  private tryScrollToSection(sectionId: string, retries: number): void {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (retries <= 0) {
      return;
    }

    setTimeout(() => this.tryScrollToSection(sectionId, retries - 1), 80);
  }

  reloadData(): void {
    forkJoin({
      missions: this.missionApiService.getAllMissionViews(),
      reservations: this.reservationApiService.getAllReservations(),
      reports: this.incidentApiService.getAllReports(),
      vehicles: this.vehicleApiService.getAllVehicles(),
      users: this.userApiService.getAllUsers()
    }).subscribe({
      next: ({ missions, reservations, reports, vehicles, users }) => {
        this.missions = missions;
        this.reservations = reservations;
        this.reports = reports;
        this.vehicles = this.sortVehiclesForDashboard(vehicles);
        this.users = this.sortUsersForDashboard(users);
        this.flashMessage = '';
        this.refreshKpis();
        this.cdr.detectChanges();
      },
      error: () => {
        this.flashMessage = 'Chargement des donnees backend impossible.';
      }
    });
  }

  private refreshKpis(): void {
    const availableVehicles = this.vehicles.filter((vehicle) => vehicle.status === 'DISPONIBLE').length;
    const pendingMissions = this.missions.filter((mission) => mission.status === 'EN_ATTENTE').length;
    const urgentMissions = this.missions.filter((mission) => mission.priority === 'URGENT' && mission.status !== 'TERMINEE').length;
    const activeUsers = this.users.filter((user) => user.active).length;

    this.kpis = [
      { label: 'Demandes mission', value: String(this.missions.length), icon: 'fa-solid fa-clipboard-list', color: '#003366' },
      { label: 'Vehicules dispo', value: String(availableVehicles), icon: 'fa-solid fa-car-side', color: '#27ae60' },
      { label: 'En attente', value: String(pendingMissions), icon: 'fa-solid fa-hourglass-half', color: '#f39c12' },
      { label: 'Utilisateurs actifs', value: String(activeUsers), icon: 'fa-solid fa-users', color: '#008080' },
      { label: 'Missions urgentes', value: String(urgentMissions), icon: 'fa-solid fa-triangle-exclamation', color: '#e74c3c' }
    ];
  }

  pendingMissions(): MissionRequestView[] {
    return this.missions.filter((mission) => mission.status === 'EN_ATTENTE');
  }

  approveMission(missionId: string, needsVehicle: boolean): void {
    const vehicleId = this.selectedVehicleByMission[missionId];
    if (needsVehicle && !vehicleId) {
      this.flashMessage = 'Selectionnez un vehicule pour cette mission.';
      return;
    }

    const missionNumber = Number.parseInt(missionId, 10);
    const vehicleNumber = vehicleId ? Number.parseInt(vehicleId, 10) : undefined;
    const mission = this.missions.find((entry) => entry.id === missionId);
    const selectedVehicle = this.vehicles.find((entry) => entry.id === vehicleId);

    this.missionApiService.approveMission(missionNumber, vehicleNumber).subscribe({
      next: () => {
        this.flashMessage = needsVehicle
          ? `Mission ${missionId} validee. Vehicule ${selectedVehicle?.model ?? ''} (${selectedVehicle?.plateNumber ?? ''}) affecte a ${mission?.employee.name ?? 'l employe'}. QR genere.`
          : `Mission ${missionId} validee sans affectation de vehicule.`;
        delete this.selectedVehicleByMission[missionId];
        this.reloadData();
      },
      error: () => {
        this.flashMessage = 'Affectation impossible. Verifiez que le vehicule est encore disponible.';
      }
    });
  }

  onVehicleSelectionChange(missionId: string, vehicleId: string): void {
    this.selectedVehicleByMission[missionId] = vehicleId;
  }

  canApproveMission(mission: MissionRequestView): boolean {
    if (!mission.needsVehicle) {
      return true;
    }

    return !!this.selectedVehicleByMission[mission.id];
  }

  rejectMission(missionId: string): void {
    this.missionToReject = missionId;
    this.rejectionReason = '';
    this.showRejectionModal = true;
  }

  submitRejection(): void {
    if (!this.missionToReject || !this.rejectionReason.trim()) {
      this.flashMessage = 'Veuillez entrer une raison justificative.';
      return;
    }

    const missionNumber = Number.parseInt(this.missionToReject, 10);
    this.missionApiService.rejectMission(missionNumber, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.flashMessage = `Mission ${this.missionToReject} refusee. Raison justificative enregistree.`;
        this.closeRejectionModal();
        this.reloadData();
      },
      error: () => {
        this.flashMessage = 'Refus de mission impossible.';
      }
    });
  }

  closeRejectionModal(): void {
    this.showRejectionModal = false;
    this.missionToReject = null;
    this.rejectionReason = '';
  }

  approveReservation(reservationId: string): void {
    const reservationNumber = Number.parseInt(reservationId, 10);
    this.reservationApiService.approveReservation(reservationNumber).subscribe({
      next: () => this.reloadData(),
      error: () => {
        this.flashMessage = 'Validation de reservation impossible.';
      }
    });
  }

  rejectReservation(reservationId: string): void {
    const reservationNumber = Number.parseInt(reservationId, 10);
    this.reservationApiService.rejectReservation(reservationNumber).subscribe({
      next: () => this.reloadData(),
      error: () => {
        this.flashMessage = 'Refus de reservation impossible.';
      }
    });
  }

  changeVehicleStatus(vehicleId: string, status: VehicleStatus): void {
    if (this.updatingVehicleIds.has(vehicleId)) {
      return;
    }

    if (!this.isBackendNumericId(vehicleId)) {
      this.flashMessage = 'Identifiant vehicule invalide.';
      return;
    }

    this.updatingVehicleIds.add(vehicleId);

    this.vehicleApiService.setVehicleStatus(vehicleId, status).subscribe({
      next: () => {
        // Always apply the status to the row that initiated the request.
        this.updateVehicleInView(vehicleId, status);
        this.refreshKpis();
        this.updatingVehicleIds.delete(vehicleId);
        this.reloadData();
      },
      error: () => {
        this.flashMessage = 'Mise a jour backend impossible.';
        this.updatingVehicleIds.delete(vehicleId);
      }
    });
  }

  cycleVehicleStatus(vehicle: Vehicle): void {
    if (!this.isBackendNumericId(vehicle.id)) {
      return;
    }

    const nextStatus: Record<VehicleStatus, VehicleStatus> = {
      DISPONIBLE: 'RESERVE',
      RESERVE: 'MAINTENANCE',
      MAINTENANCE: 'DISPONIBLE'
    };

    this.changeVehicleStatus(vehicle.id, nextStatus[vehicle.status]);
  }

  toggleUser(user: AppUser): void {
    const currentUser = this.users.find((entry) => this.sameUser(entry, user));
    if (!currentUser || currentUser.role === 'responsable') {
      return;
    }

    if (!this.isBackendNumericId(user.id)) {
      this.flashMessage = 'Identifiant utilisateur invalide.';
      return;
    }

    const identity = this.userIdentity(currentUser);
    this.updateUserActiveInView(identity, !currentUser.active);
    this.refreshKpis();

    const pendingClicks = this.pendingToggleClicksByUserId.get(user.id) ?? 0;
    this.pendingToggleClicksByUserId.set(user.id, pendingClicks + 1);
    this.processQueuedUserToggles(user.id, identity);
  }

  private processQueuedUserToggles(userId: string, identity: UserIdentity): void {
    if (this.togglingUserIds.has(userId)) {
      return;
    }

    const pendingClicks = this.pendingToggleClicksByUserId.get(userId) ?? 0;
    if (pendingClicks === 0) {
      return;
    }

    this.pendingToggleClicksByUserId.set(userId, pendingClicks - 1);
    this.togglingUserIds.add(userId);

    this.userApiService.toggleUserStatus(userId).subscribe({
      next: (updatedUser) => {
        this.updateUserActiveInView(identity, updatedUser.active);
        this.refreshKpis();
        this.togglingUserIds.delete(userId);
        this.processQueuedUserToggles(userId, identity);
      },
      error: () => {
        this.flashMessage = 'Mise a jour backend impossible.';
        this.pendingToggleClicksByUserId.set(userId, 0);
        this.togglingUserIds.delete(userId);
        this.reloadData();
      }
    });
  }

  deleteUser(user: AppUser): void {
    if (user.role === 'responsable' || this.deletingUserIds.has(user.id)) {
      return;
    }

    if (!this.isBackendNumericId(user.id)) {
      this.flashMessage = 'Identifiant utilisateur invalide.';
      return;
    }

    const label = user.name?.trim() || user.email?.trim() || `#${user.id}`;
    if (!globalThis.confirm(`Supprimer le compte ${label} ?`)) {
      return;
    }

    this.deletingUserIds.add(user.id);
    this.userApiService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((entry) => !this.sameUser(entry, user));
        this.refreshKpis();
        this.flashMessage = `Compte ${label} supprime.`;
        this.deletingUserIds.delete(user.id);
      },
      error: () => {
        this.flashMessage = 'Suppression du compte impossible.';
        this.deletingUserIds.delete(user.id);
      }
    });
  }

  isVehicleUpdating(vehicleId: string): boolean {
    return this.updatingVehicleIds.has(vehicleId);
  }

  isUserDeleting(userId: string): boolean {
    return this.deletingUserIds.has(userId);
  }

  isUserToggling(userId: string): boolean {
    return this.togglingUserIds.has(userId);
  }

  setProblemStatus(reportId: string, status: ProblemReport['status']): void {
    const reportNumber = Number.parseInt(reportId, 10);
    this.incidentApiService.updateStatus(reportNumber, status).subscribe({
      next: () => this.reloadData(),
      error: () => {
        this.flashMessage = 'Mise a jour incident impossible.';
      }
    });
  }

  availableVehiclesForMission(): Vehicle[] {
    return this.vehicles.filter((vehicle) => vehicle.status === 'DISPONIBLE');
  }

  statusChip(status: string): string {
    return {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      TERMINEE: 'bg-zinc-100 text-zinc-800',
      ECHOUEE: 'bg-rose-100 text-rose-800',
      REFUSEE: 'bg-red-100 text-red-800',
      APPROUVEE: 'bg-emerald-100 text-emerald-800',
      OUVERT: 'bg-red-100 text-red-800',
      RESOLU: 'bg-zinc-100 text-zinc-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      DISPONIBLE: 'bg-green-100 text-green-800',
      RESERVE: 'bg-blue-100 text-blue-800'
    }[status] ?? 'bg-gray-100 text-gray-700';
  }

  vehicleStatusLabel(status: VehicleStatus): string {
    const labels: Record<VehicleStatus, string> = {
      DISPONIBLE: 'DISPONIBLE',
      MAINTENANCE: 'EN MAINTENANCE',
      RESERVE: 'RESERVE / UTILISE'
    };

    return labels[status];
  }

  private isBackendNumericId(id: string): boolean {
    return /^\d+$/.test(id);
  }

  private updateVehicleInView(vehicleId: string, status: VehicleStatus): void {
    this.vehicles = this.vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, status } : vehicle
    );
  }

  private updateUserActiveInView(identity: UserIdentity, active: boolean): void {
    this.users = this.users.map((user) =>
      this.sameUser(user, identity) ? { ...user, active } : user
    );
  }

  private userIdentity(user: AppUser): UserIdentity {
    return { id: user.id, email: user.email };
  }

  private sameUser(user: AppUser, identity: UserIdentity): boolean {
    return user.id === identity.id && user.email === identity.email;
  }

  private sortUsersForDashboard(users: AppUser[]): AppUser[] {
    return [...users].sort((left, right) => {
      const roleOrder = this.userRoleOrder(left.role) - this.userRoleOrder(right.role);
      if (roleOrder !== 0) {
        return roleOrder;
      }

      const leftCreatedAt = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightCreatedAt = right.createdAt ? Date.parse(right.createdAt) : 0;
      if (leftCreatedAt !== rightCreatedAt) {
        return rightCreatedAt - leftCreatedAt;
      }

      return Number(right.id) - Number(left.id);
    });
  }

  private sortVehiclesForDashboard(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((left, right) => {
      const leftId = Number(left.id);
      const rightId = Number(right.id);

      if (!Number.isNaN(leftId) && !Number.isNaN(rightId) && leftId !== rightId) {
        return leftId - rightId;
      }

      return left.plateNumber.localeCompare(right.plateNumber);
    });
  }

  private userRoleOrder(role: AppUser['role']): number {
    return role === 'employee' ? 0 : 1;
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
