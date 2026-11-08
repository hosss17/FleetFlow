import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VehicleApiService } from '../../../../core/services/vehicle-api.service';
import { Vehicle } from '../../../../core/models/logistics.models';

export type ParkingFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';

export interface Parking3dVehicle {
  id: string;
  plateNumber: string;
  model: string;
  status: Vehicle['status'];
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class Parking3dStateService {
  constructor(private readonly vehicleApi: VehicleApiService) {}

  getVehicles(): Observable<Parking3dVehicle[]> {
    return this.vehicleApi.getAllVehicles().pipe(map((vehicles) => vehicles.map((vehicle) => this.toParkingVehicle(vehicle))));
  }

  filterVehicles(vehicles: Parking3dVehicle[], filter: ParkingFilter): Parking3dVehicle[] {
    if (filter === 'ALL') {
      return vehicles;
    }

    if (filter === 'AVAILABLE') {
      return vehicles.filter((vehicle) => vehicle.available);
    }

    return vehicles.filter((vehicle) => !vehicle.available);
  }

  private toParkingVehicle(vehicle: Vehicle): Parking3dVehicle {
    const available = vehicle.status === 'DISPONIBLE';

    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      status: vehicle.status,
      available,
    };
  }
}
