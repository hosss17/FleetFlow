import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProblemReport } from '../models/logistics.models';

interface BackendIncident {
  id: number;
  user: {
    id: number;
    name: string;
  };
  vehicle?: {
    id: number;
  };
  category: ProblemReport['category'];
  severity: ProblemReport['severity'];
  description: string;
  status: ProblemReport['status'];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class IncidentApiService {
  private readonly baseUrl = `${environment.apiUrl}/incidents`;

  constructor(private readonly http: HttpClient) {}

  getAllReports(): Observable<ProblemReport[]> {
    return this.http.get<BackendIncident[]>(this.baseUrl).pipe(
      map((reports) => reports.map((report) => this.toAppReport(report)))
    );
  }

  getReportsByUserId(userId: number): Observable<ProblemReport[]> {
    return this.http.get<BackendIncident[]>(`${this.baseUrl}/user/${userId}`).pipe(
      map((reports) => reports.map((report) => this.toAppReport(report)))
    );
  }

  createReport(payload: {
    userId: number;
    vehicleId?: number;
    category: ProblemReport['category'];
    severity: ProblemReport['severity'];
    description: string;
  }): Observable<ProblemReport> {
    return this.http.post<BackendIncident>(this.baseUrl, payload).pipe(
      map((report) => this.toAppReport(report))
    );
  }

  updateStatus(reportId: number, status: ProblemReport['status']): Observable<ProblemReport> {
    return this.http.put<BackendIncident>(`${this.baseUrl}/${reportId}/status`, { status }).pipe(
      map((report) => this.toAppReport(report))
    );
  }

  private toAppReport(report: BackendIncident): ProblemReport {
    return {
      id: String(report.id),
      employee: {
        id: String(report.user?.id ?? ''),
        name: report.user?.name ?? 'N/A'
      },
      category: report.category,
      severity: report.severity,
      description: report.description,
      relatedVehicleId: report.vehicle?.id ? String(report.vehicle.id) : undefined,
      status: report.status,
      createdAt: report.createdAt ?? ''
    };
  }
}
