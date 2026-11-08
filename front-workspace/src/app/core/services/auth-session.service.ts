import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map, shareReplay, take } from 'rxjs/operators';
import { AuthApiService, LoginResponse } from './auth-api.service';
import { UserApiService } from './user-api.service';

export interface SessionProfile {
  id: number;
  name: string;
  email: string;
  role: 'employee' | 'responsable';
  status: 'ACTIVE' | 'DISABLED';
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly profileSubject = new BehaviorSubject<SessionProfile | null>(null);
  private refreshInFlight$: Observable<string> | null = null;

  readonly profile$ = this.profileSubject.asObservable();

  constructor(
    private readonly authApiService: AuthApiService,
    private readonly userApiService: UserApiService
  ) {}

  setLoginSession(response: LoginResponse): void {
    const role = response.role === 'RESPONSABLE' ? 'responsable' : 'employee';

    localStorage.setItem('authToken', response.token);
    localStorage.setItem('currentUserId', String(response.userId));
    localStorage.setItem('currentRole', role);

    this.profileSubject.next({
      id: response.userId,
      name: response.name,
      email: response.email,
      role,
      status: response.status
    });
  }

  bootstrapProfile(): void {
    const userId = this.getUserId();
    if (!Number.isFinite(userId)) {
      this.profileSubject.next(null);
      return;
    }

    this.userApiService.getUserById(userId).pipe(take(1)).subscribe({
      next: (user) => {
        const role = user.role;
        localStorage.setItem('currentRole', role);

        this.profileSubject.next({
          id: Number.parseInt(user.id, 10),
          name: user.name,
          email: user.email,
          role,
          status: user.active ? 'ACTIVE' : 'DISABLED'
        });
      },
      error: () => {
        // Keep current UX with fallback labels if profile fetch fails.
        this.profileSubject.next(null);
      }
    });
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.authApiService.refresh().pipe(
      map((response) => {
        localStorage.setItem('authToken', response.token);
        return response.token;
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }

  clearSession(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserId');

    // Cleanup previously used keys after migration.
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentEmail');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('currentEmployeeName');
    localStorage.removeItem('currentResponsableName');

    this.profileSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUserId(): number {
    return Number.parseInt(localStorage.getItem('currentUserId') ?? '', 10);
  }

  getProfileSnapshot(): SessionProfile | null {
    return this.profileSubject.value;
  }

  getDisplayNameForRole(role: 'employee' | 'responsable' | null): string {
    const profile = this.profileSubject.value;
    if (!profile) {
      if (role === 'responsable') {
        return 'Manager';
      }

      if (role === 'employee') {
        return 'Employee';
      }

      return 'Attijari User';
    }

    return profile.name;
  }
}
