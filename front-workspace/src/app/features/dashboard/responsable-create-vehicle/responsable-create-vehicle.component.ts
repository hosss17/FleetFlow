import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Vehicle, VehicleStatus } from '../../../core/models/logistics.models';
import { VehicleApiService, CreateVehicleInput, UpdateVehicleInput } from '../../../core/services/vehicle-api.service';

interface EditableVehicle {
  model: string;
  matricule: string;
  status: VehicleStatus;
  kilometrage: number;
}

@Component({
  selector: 'app-responsable-create-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './responsable-create-vehicle.component.html',
  styleUrls: ['./responsable-create-vehicle.component.css'],
})
export class ResponsableCreateVehicleComponent {
  form: CreateVehicleInput = {
    matricule: '',
    model: '',
    status: 'DISPONIBLE',
    kilometrage: 0,
  };

  readonly statusOptions: Array<{ value: VehicleStatus; label: string }> = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'RESERVE', label: 'Reserve' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];

  errorMessage = '';
  successMessage = '';
  submitting = false;
  vehicles: Vehicle[] = [];
  loadingVehicles = false;
  editingVehicleId: string | null = null;
  editingVehicleForm: EditableVehicle | null = null;
  private readonly deletingVehicleIds = new Set<string>();
  private readonly updatingVehicleIds = new Set<string>();

  constructor(
    private readonly vehicleApiService: VehicleApiService,
    private readonly router: Router
  ) {
    this.loadVehicles();
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez renseigner un modele, une matricule et un kilometrage valide.';
      return;
    }

    this.submitting = true;
    this.vehicleApiService.createVehicle({
      matricule: this.form.matricule.trim().toUpperCase(),
      model: this.form.model.trim(),
      status: this.form.status,
      kilometrage: this.form.kilometrage,
    }).subscribe({
      next: (vehicle) => {
        this.successMessage = `Vehicule cree avec succes (${vehicle.plateNumber}).`;
        this.form = {
          matricule: '',
          model: '',
          status: 'DISPONIBLE',
          kilometrage: 0,
        };
        this.loadVehicles();
        this.submitting = false;
      },
      error: () => {
        this.errorMessage = 'Creation du vehicule impossible. Verifiez que la matricule est unique.';
        this.submitting = false;
      }
    });
  }

  goToVehicleFleet(): void {
    this.router.navigate(['/responsable/dashboard'], { fragment: 'vehicle-fleet' });
  }

  isFormValid(): boolean {
    const matricule = this.form.matricule.trim();
    const model = this.form.model.trim();
    return matricule.length >= 3 && model.length >= 2 && Number.isFinite(this.form.kilometrage) && this.form.kilometrage >= 0;
  }

  loadVehicles(): void {
    this.loadingVehicles = true;
    this.vehicleApiService.getAllVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = this.sortVehicles(vehicles);
        this.loadingVehicles = false;
      },
      error: () => {
        this.errorMessage = 'Chargement des vehicules impossible.';
        this.loadingVehicles = false;
      }
    });
  }

  startEdit(vehicle: Vehicle): void {
    this.editingVehicleId = vehicle.id;
    this.editingVehicleForm = {
      model: vehicle.model,
      matricule: vehicle.plateNumber,
      status: vehicle.status,
      kilometrage: vehicle.kilometrage ?? 0,
    };
  }

  cancelEdit(): void {
    this.editingVehicleId = null;
    this.editingVehicleForm = null;
  }

  saveEdit(vehicle: Vehicle): void {
    if (!this.editingVehicleForm || this.editingVehicleId !== vehicle.id || this.updatingVehicleIds.has(vehicle.id)) {
      return;
    }

    const payload: UpdateVehicleInput = {
      model: this.editingVehicleForm.model.trim(),
      matricule: this.editingVehicleForm.matricule.trim().toUpperCase(),
      status: this.editingVehicleForm.status,
      kilometrage: this.editingVehicleForm.kilometrage,
    };

    if (!this.isEditFormValid(payload)) {
      this.errorMessage = 'Les donnees de modification sont invalides.';
      return;
    }

    this.updatingVehicleIds.add(vehicle.id);
    this.vehicleApiService.updateVehicle(vehicle.id, payload).subscribe({
      next: () => {
        this.successMessage = `Vehicule ${payload.matricule} modifie avec succes.`;
        this.errorMessage = '';
        this.updatingVehicleIds.delete(vehicle.id);
        this.cancelEdit();
        this.loadVehicles();
      },
      error: () => {
        this.errorMessage = 'Modification du vehicule impossible.';
        this.updatingVehicleIds.delete(vehicle.id);
      }
    });
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (this.deletingVehicleIds.has(vehicle.id)) {
      return;
    }

    const label = `${vehicle.model} (${vehicle.plateNumber})`;
    if (!globalThis.confirm(`Supprimer le vehicule ${label} ?`)) {
      return;
    }

    this.deletingVehicleIds.add(vehicle.id);
    this.vehicleApiService.deleteVehicle(vehicle.id).subscribe({
      next: () => {
        this.successMessage = `Vehicule ${label} supprime.`;
        this.errorMessage = '';
        this.deletingVehicleIds.delete(vehicle.id);
        if (this.editingVehicleId === vehicle.id) {
          this.cancelEdit();
        }
        this.vehicles = this.vehicles.filter((entry) => entry.id !== vehicle.id);
      },
      error: () => {
        this.errorMessage = 'Suppression du vehicule impossible.';
        this.deletingVehicleIds.delete(vehicle.id);
      }
    });
  }

  isDeleting(vehicleId: string): boolean {
    return this.deletingVehicleIds.has(vehicleId);
  }

  isUpdating(vehicleId: string): boolean {
    return this.updatingVehicleIds.has(vehicleId);
  }

  private isEditFormValid(form: UpdateVehicleInput): boolean {
    return form.matricule.length >= 3
      && form.model.length >= 2
      && Number.isFinite(form.kilometrage)
      && form.kilometrage >= 0;
  }

  private sortVehicles(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((left, right) => Number(right.id) - Number(left.id));
  }
}
