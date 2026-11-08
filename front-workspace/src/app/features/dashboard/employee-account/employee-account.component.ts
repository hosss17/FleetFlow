import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppUser } from '../../../core/models/logistics.models';
import { UserApiService } from '../../../core/services/user-api.service';
import {
  TelegramCodeResponse,
  TelegramLinkApiService,
  TelegramLinkStatus
} from '../../../core/services/telegram-link-api.service';

interface AccountField {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-employee-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-account.component.html',
  styleUrls: ['./employee-account.component.css'],
})
export class EmployeeAccountComponent {
  employee: AppUser;
  accountFields: AccountField[] = [];
  telegramLinkStatus: TelegramLinkStatus | null = null;
  latestCode: TelegramCodeResponse | null = null;
  isLoadingLinkStatus = true;
  isGeneratingCode = false;
  isUnlinking = false;
  linkError = '';
  linkSuccess = '';

  constructor(
    private readonly userApiService: UserApiService,
    private readonly telegramLinkApiService: TelegramLinkApiService
  ) {
    this.loadTelegramLinkStatus();

    const currentUserId = Number.parseInt(localStorage.getItem('currentUserId') ?? '', 10);

    this.employee = {
      id: String(currentUserId || ''),
      name: 'Employe',
      email: '',
      role: 'employee',
      active: true
    };

    if (Number.isFinite(currentUserId)) {
      this.userApiService.getUserById(currentUserId).subscribe({
        next: (user) => {
          this.employee = user;
          this.accountFields = this.buildAccountFields();
        },
        error: () => {
          this.accountFields = this.buildAccountFields();
        }
      });
      return;
    }

    this.accountFields = this.buildAccountFields();
  }

  generateTelegramCode(): void {
    this.isGeneratingCode = true;
    this.linkError = '';
    this.linkSuccess = '';

    this.telegramLinkApiService.generateCode().subscribe({
      next: (response) => {
        this.latestCode = response;
        this.linkSuccess = 'Verification code generated. Send it to the Telegram bot with LINK <code>.';
        this.isGeneratingCode = false;
      },
      error: () => {
        this.linkError = 'Unable to generate code. Please try again.';
        this.isGeneratingCode = false;
      }
    });
  }

  unlinkTelegram(): void {
    this.isUnlinking = true;
    this.linkError = '';
    this.linkSuccess = '';

    this.telegramLinkApiService.unlink().subscribe({
      next: (response) => {
        this.latestCode = null;
        this.linkSuccess = response.message;
        this.isUnlinking = false;
        this.loadTelegramLinkStatus();
      },
      error: () => {
        this.linkError = 'Unable to unlink now. Please try again.';
        this.isUnlinking = false;
      }
    });
  }

  copyCodeToClipboard(code: string): void {
    if (!code) {
      return;
    }

    const writePromise = navigator?.clipboard?.writeText(code);
    if (writePromise === undefined) {
      this.linkError = 'Could not copy code automatically. Copy it manually.';
      return;
    }

    writePromise.then(
      () => {
        this.linkSuccess = 'Code copied to clipboard.';
      },
      () => {
        this.linkError = 'Could not copy code automatically. Copy it manually.';
      }
    );
  }

  private loadTelegramLinkStatus(): void {
    this.isLoadingLinkStatus = true;
    this.telegramLinkApiService.getStatus().subscribe({
      next: (status) => {
        this.telegramLinkStatus = status;
        this.isLoadingLinkStatus = false;
      },
      error: () => {
        this.telegramLinkStatus = null;
        this.isLoadingLinkStatus = false;
      }
    });
  }

  private buildAccountFields(): AccountField[] {
    return [
      { label: 'Nom complet', value: this.employee.name, icon: 'fas fa-user' },
      { label: 'Identifiant utilisateur', value: this.employee.id, icon: 'fas fa-id-badge' },
      { label: 'Role', value: this.employee.role === 'employee' ? 'Employe' : 'Responsable', icon: 'fas fa-user-shield' },
      { label: 'Email professionnel', value: this.employee.email, icon: 'fas fa-envelope' },
      { label: 'Telephone', value: '+216 70 000 000', icon: 'fas fa-phone' },
      { label: 'Departement / Service', value: 'Logistique et Mobilite', icon: 'fas fa-sitemap' },
      { label: 'Agence', value: 'Attijari Bank - Tunis Centre', icon: 'fas fa-building' },
      { label: 'Statut compte', value: this.employee.active ? 'Actif' : 'Inactif', icon: 'fas fa-circle-check' }
    ];
  }
}
