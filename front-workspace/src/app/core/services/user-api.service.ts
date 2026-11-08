import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppUser, CreateEmployeeAccountInput } from '../models/logistics.models';

interface BackendUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYE' | 'RESPONSABLE';
  status: 'ACTIVE' | 'DISABLED';
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getAllUsers(): Observable<AppUser[]> {
    return this.http.get<BackendUser[]>(this.baseUrl).pipe(
      map((users) => users.map((user) => this.toAppUser(user)))
    );
  }

  getUserById(id: number): Observable<AppUser> {
    return this.http.get<BackendUser>(`${this.baseUrl}/${id}`).pipe(
      map((user) => this.toAppUser(user))
    );
  }

  createEmployeeAccount(input: CreateEmployeeAccountInput): Observable<AppUser> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password?.trim() || this.generateTemporaryPassword();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !emailPattern.test(email) || !password) {
      return throwError(() => new Error('Invalid user payload'));
    }

    const payload: Omit<BackendUser, 'id'> = {
      name,
      email,
      password,
      role: 'EMPLOYE',
      status: input.active === false ? 'DISABLED' : 'ACTIVE'
    };

    return this.http.post<BackendUser>(this.baseUrl, payload).pipe(
      map((user) => this.toAppUser(user))
    );
  }

  toggleUserStatus(userId: string): Observable<AppUser> {
    const id = Number.parseInt(userId, 10);
    return this.http.get<BackendUser>(`${this.baseUrl}/${id}`).pipe(
      switchMap((user) => {
        const payload: BackendUser = {
          ...user,
          status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
        };
        return this.http.put<BackendUser>(`${this.baseUrl}/${id}`, payload);
      }),
      map((user) => this.toAppUser(user))
    );
  }

  deleteUser(userId: string): Observable<void> {
    const id = Number.parseInt(userId, 10);
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toAppUser(user: BackendUser): AppUser {
    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role === 'RESPONSABLE' ? 'responsable' : 'employee',
      active: user.status === 'ACTIVE',
      createdAt: user.createdAt ?? ''
    };
  }

  private generateTemporaryPassword(): string {
    const seed = Math.random().toString(36).slice(-8);
    return `Tmp!${seed}A1`;
  }
}
