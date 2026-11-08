import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppUser } from '../../../core/models/logistics.models';
import { UserApiService } from '../../../core/services/user-api.service';

@Component({
  selector: 'app-responsable-create-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './responsable-create-account.component.html',
  styleUrls: ['./responsable-create-account.component.css'],
})
export class ResponsableCreateAccountComponent {
  form = {
    name: '',
    email: '',
    password: '',
    active: true,
  };

  errorMessage = '';
  successMessage = '';
  users: AppUser[] = [];
  loadingUsers = false;
  deletingUserIds = new Set<string>();

  constructor(
    private readonly userApiService: UserApiService,
    private readonly router: Router
  ) {
    this.loadUsers();
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Nom, email et mot de passe valides sont obligatoires.';
      return;
    }

    this.userApiService.createEmployeeAccount({
      name: this.form.name,
      email: this.form.email,
      password: this.form.password,
      active: this.form.active,
    }).subscribe({
      next: (user) => {
        this.successMessage = `Compte cree avec succes (ID: ${user.id}).`;
        this.form = {
          name: '',
          email: '',
          password: '',
          active: true,
        };
        this.loadUsers();
      },
      error: (err) => {
        // Detect duplicate-email response from backend (e.g. HTTP 409)
        const isDuplicateEmail =
          err?.status === 409 ||
          (err?.error && typeof err.error === 'string' && /email/i.test(err.error)) ||
          (err?.error && typeof err.error === 'object' && err.error.message && /email/i.test(err.error.message));

        if (isDuplicateEmail) {
          this.errorMessage = 'cet email est deja utilisé';
        } else {
          this.errorMessage = 'Creation du compte impossible.';
        }
      }
    });
  }

  goToUsersManagement(): void {
    this.router.navigate(['/responsable/dashboard'], { fragment: 'users-management' });
  }

  isFormValid(): boolean {
    const name = this.form.name.trim();
    const email = this.form.email.trim();
    const password = this.form.password.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return name.length > 0 && emailPattern.test(email) && password.length > 0;
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userApiService.getAllUsers().subscribe({
      next: (users) => {
        this.users = this.sortUsers(users);
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      }
    });
  }

  deleteUser(user: AppUser): void {
    if (user.role === 'responsable' || this.deletingUserIds.has(user.id)) {
      return;
    }

    const label = user.name?.trim() || user.email?.trim() || `#${user.id}`;
    if (!globalThis.confirm(`Supprimer le compte ${label} ?`)) {
      return;
    }

    this.deletingUserIds.add(user.id);
    this.userApiService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = `Compte ${label} supprime.`;
        this.errorMessage = '';
        this.users = this.users.filter((entry) => !(entry.id === user.id && entry.email === user.email));
        this.deletingUserIds.delete(user.id);
      },
      error: () => {
        this.errorMessage = 'Suppression du compte impossible.';
        this.deletingUserIds.delete(user.id);
      }
    });
  }

  isDeleting(userId: string): boolean {
    return this.deletingUserIds.has(userId);
  }

  private sortUsers(users: AppUser[]): AppUser[] {
    return [...users].sort((left, right) => Number(right.id) - Number(left.id));
  }
}
