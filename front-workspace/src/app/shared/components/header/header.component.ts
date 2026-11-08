import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppNotification, NotificationApiService } from '../../../core/services/notification-api.service';
import { RealtimeNotificationService } from '../../../core/services/realtime-notification.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() role: 'employee' | 'responsable' = 'employee';
  @Input() userName = 'Utilisateur';

  menuOpen = false;
  notifications: AppNotification[] = [];
  notificationCount = 0;
  notificationFilter: 'ALL' | 'UNREAD' | 'ACTION_REQUIRED' = 'ALL';

  private realtimeSubscription?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly notificationApiService: NotificationApiService,
    private readonly realtimeNotificationService: RealtimeNotificationService,
    private readonly authSessionService: AuthSessionService
  ) {}

  ngOnInit(): void {
    const userId = Number.parseInt(localStorage.getItem('currentUserId') ?? '', 10);
    if (!Number.isFinite(userId)) {
      return;
    }

    this.notificationApiService.getNotificationsByUserId(userId).subscribe({
      next: (notifications) => {
        this.notifications = this.sortByNewest(notifications.filter((notification) => this.isNotificationRelevantForRole(notification.type)));
        this.notificationFilter = this.role === 'responsable' ? 'ACTION_REQUIRED' : 'UNREAD';
        this.updateNotificationCount();
      },
      error: () => {
        this.notifications = [];
        this.notificationFilter = this.role === 'responsable' ? 'ACTION_REQUIRED' : 'UNREAD';
        this.updateNotificationCount();
      }
    });

    this.realtimeNotificationService.connect(userId);
    this.realtimeSubscription = this.realtimeNotificationService.notifications$().subscribe((notification) => {
      if (!this.isNotificationRelevantForRole(notification.type)) {
        return;
      }

      this.notifications = this.sortByNewest([notification, ...this.notifications.filter((item) => item.id !== notification.id)]);
      this.updateNotificationCount();
    });
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
    this.realtimeNotificationService.disconnect();
  }

  logout() {
    this.authSessionService.clearSession();
    localStorage.removeItem('sidebarExpanded');
    this.realtimeNotificationService.disconnect();
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  getCurrentDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return today.toLocaleDateString('fr-FR', options);
  }

  getProfileRoute(): string {
    return this.role === 'responsable' ? '/responsable/account' : '/employee/account';
  }

  markNotificationAsRead(notification: AppNotification): void {
    if (notification.readStatus === 'LU') {
      return;
    }

    const notificationId = Number.parseInt(notification.id, 10);
    if (!Number.isFinite(notificationId)) {
      return;
    }

    this.notificationApiService.markAsRead(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.map((entry) =>
          entry.id === notification.id ? { ...entry, readStatus: 'LU' } : entry
        );
        this.updateNotificationCount();
      }
    });
  }

  notificationTitle(notification: AppNotification): string {
    return {
      MISSION_APPROUVEE: 'Mission approuvee',
      MISSION_REFUSEE: 'Mission refusee',
      MISSION_DEMANDEE: 'Mission en attente de validation',
      RESERVATION_DEMANDEE: 'Reservation vehicule en attente',
      INCIDENT_SIGNALE: 'Incident signale a traiter'
    }[notification.type] ?? 'Notification';
  }

  setNotificationFilter(filter: 'ALL' | 'UNREAD' | 'ACTION_REQUIRED'): void {
    this.notificationFilter = filter;
  }

  isFilterActive(filter: 'ALL' | 'UNREAD' | 'ACTION_REQUIRED'): boolean {
    return this.notificationFilter === filter;
  }

  filteredNotifications(): AppNotification[] {
    if (this.notificationFilter === 'UNREAD') {
      return this.notifications.filter((notification) => notification.readStatus !== 'LU');
    }

    if (this.notificationFilter === 'ACTION_REQUIRED') {
      return this.notifications.filter((notification) => this.isManagerActionRequired(notification.type));
    }

    return this.notifications;
  }

  unreadCount(): number {
    return this.notifications.filter((notification) => notification.readStatus !== 'LU').length;
  }

  managerActionCount(): number {
    return this.notifications.filter((notification) => this.isManagerActionRequired(notification.type)).length;
  }

  relativeTime(dateValue: string): string {
    const createdAt = new Date(dateValue);
    if (Number.isNaN(createdAt.getTime())) {
      return 'A l instant';
    }

    const diffMs = Date.now() - createdAt.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  }

  private updateNotificationCount(): void {
    this.notificationCount = this.notifications.filter((notification) => notification.readStatus !== 'LU').length;
  }

  private sortByNewest(notifications: AppNotification[]): AppNotification[] {
    return [...notifications].sort((left, right) => {
      const leftDate = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightDate = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightDate - leftDate;
    });
  }

  private isManagerActionRequired(type: string): boolean {
    return type === 'MISSION_DEMANDEE' || type === 'RESERVATION_DEMANDEE' || type === 'INCIDENT_SIGNALE';
  }

  private isNotificationRelevantForRole(type: string): boolean {
    if (this.role === 'responsable') {
      return this.isManagerActionRequired(type);
    }

    return type === 'MISSION_APPROUVEE' || type === 'MISSION_REFUSEE';
  }
}
