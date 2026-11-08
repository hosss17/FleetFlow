import { Component } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthSessionService } from './core/services/auth-session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  currentRole: 'employee' | 'responsable' | null = null;
  userName = 'Attijari User';
  sidebarExpanded = false;

  constructor(
    private readonly router: Router,
    private readonly authSessionService: AuthSessionService
  ) {
    this.authSessionService.bootstrapProfile();

    this.authSessionService.profile$.subscribe(() => {
      this.userName = this.authSessionService.getDisplayNameForRole(this.currentRole);
    });

    // Use browser URL first so shell state is correct on first paint before router events.
    this.syncShellState(globalThis.location?.pathname || this.router.url);

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: any) => {
      this.syncShellState(event.urlAfterRedirects ?? this.router.url);
    });

    // Load sidebar state from localStorage on init
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      this.sidebarExpanded = savedState === 'true';
    }
  }

  onSidebarStateChange(expanded: boolean) {
    this.sidebarExpanded = expanded;
  }

  private syncShellState(url: string): void {
    const normalizedUrl = (url || '').split('?')[0].split('#')[0];

    // Never show dashboard shell on public/login routes.
    if (normalizedUrl === '' || normalizedUrl === '/' || normalizedUrl.startsWith('/login')) {
      this.currentRole = null;
      this.userName = this.getUserNameForRole(null);
      return;
    }

    if (normalizedUrl.startsWith('/responsable')) {
      this.currentRole = 'responsable';
      this.userName = this.getUserNameForRole('responsable');
      return;
    }

    if (normalizedUrl.startsWith('/employee')) {
      this.currentRole = 'employee';
      this.userName = this.getUserNameForRole('employee');
      return;
    }

    this.currentRole = null;
    this.userName = this.getUserNameForRole(null);
  }

  private getUserNameForRole(role: 'employee' | 'responsable' | null): string {
    return this.authSessionService.getDisplayNameForRole(role);
  }
}
