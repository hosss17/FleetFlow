import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  userId: string;
  missionId?: string;
  type: string;
  message: string;
  readStatus: 'LU' | 'NON_LU';
  createdAt: string;
}

interface BackendNotification {
  id: number;
  type: string;
  message: string;
  readStatus: 'LU' | 'NON_LU';
  createdAt: string;
  user?: { id: number };
  mission?: { id: number };
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  getNotificationsByUserId(userId: number): Observable<AppNotification[]> {
    return this.http
      .get<BackendNotification[]>(`${this.baseUrl}/user/${userId}`)
      .pipe(map((notifications) => notifications.map((notification) => this.toAppNotification(notification))));
  }

  markAsRead(notificationId: number): Observable<AppNotification> {
    return this.http
      .put<BackendNotification>(`${this.baseUrl}/${notificationId}/read`, {})
      .pipe(map((notification) => this.toAppNotification(notification)));
  }

  private toAppNotification(notification: BackendNotification): AppNotification {
    return {
      id: String(notification.id),
      userId: String(notification.user?.id ?? ''),
      missionId: notification.mission?.id ? String(notification.mission.id) : undefined,
      type: notification.type ?? 'SYSTEM',
      message: notification.message ?? '',
      readStatus: notification.readStatus ?? 'NON_LU',
      createdAt: notification.createdAt ?? ''
    };
  }
}
