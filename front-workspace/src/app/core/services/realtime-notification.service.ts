import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from './notification-api.service';

interface NotificationPushMessage {
  id: number;
  userId: number;
  missionId?: number;
  type: string;
  message: string;
  readStatus: 'LU' | 'NON_LU';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeNotificationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private readonly notificationSubject = new Subject<AppNotification>();

  connect(userId: number): void {
    if (!Number.isFinite(userId)) {
      return;
    }

    this.disconnect();

    const wsBaseUrl = this.getWebSocketBaseUrl();
    this.socket = new WebSocket(`${wsBaseUrl}/ws/notifications?userId=${userId}`);

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as NotificationPushMessage;
        this.notificationSubject.next({
          id: String(payload.id),
          userId: String(payload.userId),
          missionId: payload.missionId ? String(payload.missionId) : undefined,
          type: payload.type,
          message: payload.message,
          readStatus: payload.readStatus,
          createdAt: payload.createdAt
        });
      } catch {
        // Ignore invalid push payload.
      }
    };

    this.socket.onerror = () => {
      // Keep the app running even if realtime transport is temporarily unavailable.
    };

    this.socket.onclose = () => {
      this.socket = null;
    };
  }

  notifications$(): Observable<AppNotification> {
    return this.notificationSubject.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private getWebSocketBaseUrl(): string {
    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
    if (apiBase.startsWith('https://')) {
      return apiBase.replace('https://', 'wss://');
    }

    if (apiBase.startsWith('http://')) {
      return apiBase.replace('http://', 'ws://');
    }

    return apiBase;
  }
}
