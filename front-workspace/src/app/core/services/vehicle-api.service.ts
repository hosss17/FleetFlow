import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Vehicle, VehicleStatus } from '../models/logistics.models';

interface BackendVehicle {
  id: number;
  matricule: string;
  model?: string;
  status: 'DISPONIBLE' | 'RESERVE' | 'EN_MAINTENANCE' | 'PANNE';
  kilometrage: number;
}

interface CreateBackendVehicleInput {
  matricule: string;
  model: string;
  status: BackendVehicle['status'];
  kilometrage: number;
}

export interface CreateVehicleInput {
  matricule: string;
  model: string;
  status: VehicleStatus;
  kilometrage: number;
}

export interface UpdateVehicleInput {
  matricule: string;
  model: string;
  status: VehicleStatus;
  kilometrage: number;
}

@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  private readonly baseUrl = `${environment.apiUrl}/vehicles`;

  constructor(private readonly http: HttpClient) {}

  getAllVehicles(): Observable<Vehicle[]> {
    return this.http.get<BackendVehicle[]>(this.baseUrl).pipe(
      map((vehicles) => vehicles.map((vehicle) => this.toAppVehicle(vehicle)))
    );
  }

  setVehicleStatus(vehicleId: string, status: VehicleStatus): Observable<Vehicle> {
    const id = Number.parseInt(vehicleId, 10);
    return this.http.get<BackendVehicle>(`${this.baseUrl}/${id}`).pipe(
      switchMap((vehicle) => {
        const payload: BackendVehicle = {
          ...vehicle,
          status: this.toBackendStatus(status)
        };
        return this.http.put<BackendVehicle>(`${this.baseUrl}/${id}`, payload);
      }),
      map((vehicle) => this.toAppVehicle(vehicle))
    );
  }

  createVehicle(input: CreateVehicleInput): Observable<Vehicle> {
    const payload: CreateBackendVehicleInput = {
      matricule: input.matricule,
      model: input.model,
      status: this.toBackendStatus(input.status),
      kilometrage: input.kilometrage,
    };

    return this.http.post<BackendVehicle>(this.baseUrl, payload).pipe(
      map((vehicle) => this.toAppVehicle(vehicle))
    );
  }

  updateVehicle(vehicleId: string, input: UpdateVehicleInput): Observable<Vehicle> {
    const id = Number.parseInt(vehicleId, 10);

    return this.http.get<BackendVehicle>(`${this.baseUrl}/${id}`).pipe(
      switchMap((existingVehicle) => {
        const payload: BackendVehicle = {
          ...existingVehicle,
          matricule: input.matricule,
          model: input.model,
          status: this.toBackendStatus(input.status),
          kilometrage: input.kilometrage,
        };
        return this.http.put<BackendVehicle>(`${this.baseUrl}/${id}`, payload);
      }),
      map((vehicle) => this.toAppVehicle(vehicle))
    );
  }

  deleteVehicle(vehicleId: string): Observable<void> {
    const id = Number.parseInt(vehicleId, 10);
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toAppVehicle(vehicle: BackendVehicle): Vehicle {
    const fallbackModel = 'Modele inconnu';
    return {
      id: String(vehicle.id),
      plateNumber: vehicle.matricule,
      model: vehicle.model?.trim() ? vehicle.model : fallbackModel,
      type: 'BERLINE',
      status: this.toAppStatus(vehicle.status),
      kilometrage: vehicle.kilometrage,
    };
  }

  private toAppStatus(status: BackendVehicle['status']): VehicleStatus {
    if (status === 'EN_MAINTENANCE' || status === 'PANNE') {
      return 'MAINTENANCE';
    }
    return status;
  }

  private toBackendStatus(status: VehicleStatus): BackendVehicle['status'] {
    if (status === 'MAINTENANCE') {
      return 'EN_MAINTENANCE';
    }
    return status;
  }
}
