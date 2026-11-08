import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { VehicleReservation } from '../models/logistics.models';

interface BackendReservation {
  id: number;
  user: {
    id: number;
    name: string;
  };
  requestedType: VehicleReservation['requestedType'];
  fromDate: string;
  toDate: string;
  reason: string;
  status: VehicleReservation['status'];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationApiService {
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private readonly http: HttpClient) {}

  getAllReservations(): Observable<VehicleReservation[]> {
    return this.http.get<BackendReservation[]>(this.baseUrl).pipe(
      map((reservations) => reservations.map((reservation) => this.toAppReservation(reservation)))
    );
  }

  getReservationsByUserId(userId: number): Observable<VehicleReservation[]> {
    return this.http.get<BackendReservation[]>(`${this.baseUrl}/user/${userId}`).pipe(
      map((reservations) => reservations.map((reservation) => this.toAppReservation(reservation)))
    );
  }

  createReservation(payload: {
    userId: number;
    requestedType: VehicleReservation['requestedType'];
    fromDate: string;
    toDate: string;
    reason: string;
  }): Observable<VehicleReservation> {
    return this.http.post<BackendReservation>(this.baseUrl, payload).pipe(
      map((reservation) => this.toAppReservation(reservation))
    );
  }

  approveReservation(reservationId: number): Observable<VehicleReservation> {
    return this.http.put<BackendReservation>(`${this.baseUrl}/${reservationId}/approve`, {}).pipe(
      map((reservation) => this.toAppReservation(reservation))
    );
  }

  rejectReservation(reservationId: number): Observable<VehicleReservation> {
    return this.http.put<BackendReservation>(`${this.baseUrl}/${reservationId}/reject`, {}).pipe(
      map((reservation) => this.toAppReservation(reservation))
    );
  }

  private toAppReservation(reservation: BackendReservation): VehicleReservation {
    return {
      id: String(reservation.id),
      employee: {
        id: String(reservation.user?.id ?? ''),
        name: reservation.user?.name ?? 'N/A'
      },
      requestedType: reservation.requestedType,
      fromDate: reservation.fromDate,
      toDate: reservation.toDate,
      reason: reservation.reason,
      status: reservation.status,
      createdAt: reservation.createdAt ?? ''
    };
  }
}
