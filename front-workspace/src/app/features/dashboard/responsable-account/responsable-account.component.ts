import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  selector: 'app-responsable-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsable-account.component.html',
  styleUrls: ['./responsable-account.component.css'],
})
export class ResponsableAccountComponent implements OnInit {
  manager!: AppUser;
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
    private readonly telegramLinkApiService: TelegramLinkApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTelegramLinkStatus();

    this.userApiService.getAllUsers().subscribe({
      next: (users) => {
        const responsable = users.find((user) => user.role === 'responsable');
        if (responsable) {
          this.setManager(responsable);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.accountFields = [];
        this.cdr.detectChanges();
      }
    });
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.linkError = 'Unable to generate code. Please try again.';
        this.isGeneratingCode = false;
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
      this.cdr.detectChanges();
      return;
    }

    writePromise.then(
      () => {
        this.linkSuccess = 'Code copied to clipboard.';
        this.cdr.detectChanges();
      },
      () => {
        this.linkError = 'Could not copy code automatically. Copy it manually.';
        this.cdr.detectChanges();
      }
    );
  }

  private setManager(manager: AppUser): void {
    this.manager = manager;
    this.accountFields = [
      { label: 'Nom complet', value: this.manager.name, icon: 'fas fa-user-tie' },
      { label: 'Identifiant utilisateur', value: this.manager.id, icon: 'fas fa-id-badge' },
      { label: 'Role', value: 'Responsable', icon: 'fas fa-user-shield' },
      { label: 'Email professionnel', value: this.manager.email, icon: 'fas fa-envelope' },
      { label: 'Telephone', value: '+216 71 111 111', icon: 'fas fa-phone' },
      { label: 'Departement / Service', value: 'Pilotage Logistique', icon: 'fas fa-sitemap' },
      { label: 'Agence', value: 'Attijari Bank - Siege', icon: 'fas fa-building' },
      { label: 'Statut compte', value: this.manager.active ? 'Actif' : 'Inactif', icon: 'fas fa-circle-check' }
    ];
  }

  private loadTelegramLinkStatus(): void {
    this.isLoadingLinkStatus = true;
    this.telegramLinkApiService.getStatus().subscribe({
      next: (status) => {
        this.telegramLinkStatus = status;
        this.isLoadingLinkStatus = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.telegramLinkStatus = null;
        this.isLoadingLinkStatus = false;
        this.cdr.detectChanges();
      }
    });
  }
}
