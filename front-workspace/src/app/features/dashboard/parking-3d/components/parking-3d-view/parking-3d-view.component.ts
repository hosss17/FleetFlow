import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  Parking3dStateService,
  Parking3dVehicle,
  ParkingFilter,
} from '../../services/parking-3d-state.service';
import { RealtimeNotificationService } from '../../../../../core/services/realtime-notification.service';

interface ParkingSpot {
  id: string;
  label: string;
  zone: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-parking-3d-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-3d-view.component.html',
  styleUrl: './parking-3d-view.component.css',
})
export class Parking3dViewComponent implements OnInit, OnDestroy {
  readonly filters: ParkingFilter[] = ['ALL', 'AVAILABLE', 'UNAVAILABLE'];
  readonly filterLabels: Record<ParkingFilter, string> = {
    ALL: 'Tous',
    AVAILABLE: 'Disponibles',
    UNAVAILABLE: 'Indisponibles',
  };

  selectedFilter: ParkingFilter = 'ALL';
  selectedSpotId = '';
  searchTerm = '';
  appliedSearchTerm = '';
  searchFeedback = '';

  readonly boardWidth = 1180;
  readonly boardHeight = 700;
  readonly maxPanX = 140;
  readonly maxPanY = 96;
  panX = 0;
  panY = 0;
  isDraggingMap = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private panStartX = 0;
  private panStartY = 0;
  private draggedDuringPointer = false;

  totalCount = 0;
  availableCount = 0;
  unavailableCount = 0;

  loading = true;
  loadingError = '';
  loadingHint = 'Chargement de la flotte...';

  private readonly subscriptions = new Subscription();
  private vehicleLoadSubscription?: Subscription;
  private refreshTimerId?: number;
  private pollingIntervalId?: number;

  readonly spots: ParkingSpot[] = this.buildSpots();
  private readonly spotAssignments = new Map<string, Parking3dVehicle>();
  private allVehicles: Parking3dVehicle[] = [];
  private filteredVehicles: Parking3dVehicle[] = [];

  constructor(
    private readonly stateService: Parking3dStateService,
    private readonly realtimeNotificationService: RealtimeNotificationService,
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
    this.initializeRealtimeRefresh();
    this.startPollingRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.vehicleLoadSubscription?.unsubscribe();
    if (this.refreshTimerId) {
      globalThis.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = undefined;
    }
    if (this.pollingIntervalId) {
      globalThis.clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = undefined;
    }
    this.realtimeNotificationService.disconnect();
  }

  applyFilter(filter: ParkingFilter): void {
    this.selectedFilter = filter;
    this.filteredVehicles = this.stateService.filterVehicles(this.allVehicles, filter);
  }

  onSearchTermChange(): void {
    if (!this.searchTerm.trim()) {
      this.appliedSearchTerm = '';
      this.searchFeedback = '';
    }
  }

  confirmSearch(): void {
    const query = this.searchTerm.trim().toLowerCase();
    this.appliedSearchTerm = query;

    if (!query) {
      this.selectedSpotId = '';
      this.searchFeedback = 'Recherche reinitialisee.';
      return;
    }

    const matchedSpot = this.spots.find((spot) => {
      const vehicle = this.getAssignedVehicle(spot.id);
      if (!vehicle) {
        return false;
      }

      return (
        vehicle.plateNumber.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query)
      );
    });

    if (!matchedSpot) {
      this.selectedSpotId = '';
      this.searchFeedback = 'Aucun vehicule ne correspond a cette recherche.';
      return;
    }

    if (this.selectedFilter !== 'ALL') {
      this.applyFilter('ALL');
    }

    this.selectedSpotId = matchedSpot.id;
    this.searchFeedback = `Vehicule trouve au spot ${matchedSpot.label}.`;
  }

  private loadVehicles(): void {
    this.vehicleLoadSubscription?.unsubscribe();
    this.vehicleLoadSubscription = this.stateService.getVehicles().subscribe({
      next: (vehicles) => {
        this.allVehicles = vehicles;
        this.totalCount = vehicles.length;
        this.availableCount = vehicles.filter((vehicle) => vehicle.available).length;
        this.unavailableCount = this.totalCount - this.availableCount;
        this.assignVehiclesToSpots();
        this.applyFilter(this.selectedFilter);
        this.loading = false;
        this.loadingHint = 'Parking charge.';
        this.loadingError = '';
      },
      error: () => {
        this.loading = false;
        this.loadingError = 'Impossible de charger les donnees de flotte pour le moment.';
      },
    });
  }

  get viewBox(): string {
    return `0 0 ${this.boardWidth} ${this.boardHeight}`;
  }

  get mapTransform(): string {
    return `translate(${this.panX} ${this.panY})`;
  }

  get selectedVehicle(): Parking3dVehicle | undefined {
    const vehicle = this.spotAssignments.get(this.selectedSpotId);
    if (!vehicle) {
      return undefined;
    }

    return this.isVehicleVisible(vehicle) ? vehicle : undefined;
  }

  get selectedSpotLabel(): string {
    const spot = this.spots.find((current) => current.id === this.selectedSpotId);
    if (!spot) {
      return '-';
    }

    return spot.label;
  }

  selectSpot(spotId: string): void {
    if (this.draggedDuringPointer) {
      return;
    }

    if (!this.isSpotVisible(spotId)) {
      return;
    }

    this.selectedSpotId = this.selectedSpotId === spotId ? '' : spotId;
  }

  onSpotPointerDown(event: PointerEvent): void {
    event.stopPropagation();
  }

  onMapPointerDown(event: PointerEvent): void {
    this.isDraggingMap = true;
    this.draggedDuringPointer = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.panStartX = this.panX;
    this.panStartY = this.panY;
  }

  onMapPointerMove(event: PointerEvent): void {
    if (!this.isDraggingMap) {
      return;
    }

    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      this.draggedDuringPointer = true;
    }

    this.panX = this.clamp(this.panStartX + dx, -this.maxPanX, this.maxPanX);
    this.panY = this.clamp(this.panStartY + dy, -this.maxPanY, this.maxPanY);
  }

  onMapPointerUp(): void {
    this.isDraggingMap = false;
    globalThis.setTimeout(() => {
      this.draggedDuringPointer = false;
    }, 0);
  }

  resetMapPosition(): void {
    this.panX = 0;
    this.panY = 0;
  }

  refreshNow(): void {
    this.loadVehicles();
  }

  onSpotKeydown(event: KeyboardEvent, spotId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.selectSpot(spotId);
  }

  getSpotVehicle(spotId: string): Parking3dVehicle | undefined {
    const vehicle = this.getAssignedVehicle(spotId);
    if (!vehicle || !this.isVehicleVisible(vehicle)) {
      return undefined;
    }

    return vehicle;
  }

  getSpotClass(spotId: string): string {
    const vehicle = this.getAssignedVehicle(spotId);
    if (!vehicle) {
      return 'spot empty';
    }

    const statusClass = vehicle.available ? 'spot available' : 'spot unavailable';
    return this.isVehicleVisible(vehicle) ? statusClass : `${statusClass} filtered-out`;
  }

  getSpotStatusText(spotId: string): string {
    const vehicle = this.getAssignedVehicle(spotId);
    if (!vehicle) {
      return 'Libre';
    }

    return vehicle.available ? 'Disponible' : 'Indisponible';
  }

  isSpotSearchMatch(spotId: string): boolean {
    const vehicle = this.getAssignedVehicle(spotId);
    if (!vehicle || !this.appliedSearchTerm) {
      return false;
    }

    const query = this.appliedSearchTerm;
    return vehicle.plateNumber.toLowerCase().includes(query) || vehicle.model.toLowerCase().includes(query);
  }

  getSpotAriaLabel(spot: ParkingSpot): string {
    const vehicle = this.getAssignedVehicle(spot.id);
    if (!vehicle) {
      return `Spot ${spot.label} - Libre`;
    }

    const status = vehicle.available ? 'Disponible' : 'Indisponible';
    const visibilitySuffix = this.isVehicleVisible(vehicle) ? '' : ' - non affiche par filtre';
    return `Spot ${spot.label} - ${status} - ${vehicle.plateNumber}${visibilitySuffix}`;
  }

  getSpotPlateLabel(spotId: string): string {
    const vehicle = this.getAssignedVehicle(spotId);
    if (!vehicle) {
      return '';
    }

    const plate = vehicle.plateNumber;
    return plate.length > 10 ? `${plate.slice(0, 10)}.` : plate;
  }

  private isVehicleVisible(vehicle: Parking3dVehicle): boolean {
    const visibleWithFilter =
      this.selectedFilter === 'ALL' || this.filteredVehicles.some((current) => current.id === vehicle.id);

    if (!visibleWithFilter) {
      return false;
    }

    if (!this.searchTerm.trim()) {
      return true;
    }

    const query = this.appliedSearchTerm;
    if (!query) {
      return true;
    }

    return vehicle.plateNumber.toLowerCase().includes(query) || vehicle.model.toLowerCase().includes(query);
  }

  private assignVehiclesToSpots(): void {
    this.spotAssignments.clear();
    const orderedVehicles = [...this.allVehicles].sort((left, right) =>
      left.plateNumber.localeCompare(right.plateNumber),
    );

    this.spots.forEach((spot, index) => {
      const vehicle = orderedVehicles[index];
      if (vehicle) {
        this.spotAssignments.set(spot.id, vehicle);
      }
    });
  }

  private initializeRealtimeRefresh(): void {
    const userId = Number.parseInt(localStorage.getItem('currentUserId') ?? '', 10);
    if (!Number.isFinite(userId)) {
      return;
    }

    this.realtimeNotificationService.connect(userId);
    this.subscriptions.add(
      this.realtimeNotificationService.notifications$().subscribe(() => {
        this.scheduleRefresh();
      }),
    );
  }

  private scheduleRefresh(): void {
    if (this.refreshTimerId) {
      return;
    }

    this.refreshTimerId = globalThis.setTimeout(() => {
      this.refreshTimerId = undefined;
      this.loadVehicles();
    }, 650);
  }

  private startPollingRefresh(): void {
    this.pollingIntervalId = globalThis.setInterval(() => {
      this.loadVehicles();
    }, 5000);
  }

  private getAssignedVehicle(spotId: string): Parking3dVehicle | undefined {
    return this.spotAssignments.get(spotId);
  }

  private isSpotVisible(spotId: string): boolean {
    const vehicle = this.getAssignedVehicle(spotId);
    if (!vehicle) {
      return false;
    }

    return this.isVehicleVisible(vehicle);
  }

  private buildSpots(): ParkingSpot[] {
    const zones = [
      { key: 'A', y: 88 },
      { key: 'B', y: 292 },
      { key: 'C', y: 496 },
    ];

    const spots: ParkingSpot[] = [];
    const width = 72;
    const height = 88;
    const startX = 70;
    const gap = 16;
    const spotsPerZone = 12;

    zones.forEach((zone) => {
      for (let i = 0; i < spotsPerZone; i += 1) {
        const spotId = `${zone.key}-${String(i + 1).padStart(2, '0')}`;
        spots.push({
          id: spotId,
          label: `${zone.key}${i + 1}`,
          zone: zone.key,
          x: startX + i * (width + gap),
          y: zone.y,
          width,
          height,
        });
      }
    });

    return spots;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
