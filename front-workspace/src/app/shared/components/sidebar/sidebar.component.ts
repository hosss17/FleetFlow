import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthSessionService } from '../../../core/services/auth-session.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  fragment?: string;
  exact?: boolean;
  badge?: number;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Input() role: 'employee' | 'responsable' = 'employee';
  @Output() sidebarStateChange = new EventEmitter<boolean>();

  isExpanded = false;
  isHovering = false;
  isMobile = false;
  expandedMenus: { [key: string]: boolean } = {};

  constructor(
    private readonly router: Router,
    private readonly authSessionService: AuthSessionService
  ) {}

  ngOnInit() {
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      this.isExpanded = savedState === 'true';
      this.updateBodyClass();
    }

    this.checkMobile();
  }

  @HostListener('window:resize')
  checkMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    localStorage.setItem('sidebarExpanded', String(this.isExpanded));
    this.updateBodyClass();
    this.sidebarStateChange.emit(this.isExpanded);
  }

  onMouseEnter() {
    if (!this.isMobile && !this.isExpanded) {
      this.isHovering = true;
      this.updateBodyClass();
    }
  }

  onMouseLeave() {
    if (!this.isMobile && !this.isExpanded) {
      this.isHovering = false;
      this.updateBodyClass();
      this.expandedMenus = {};
    }
  }

  updateBodyClass() {
    if (this.isExpanded || this.isHovering) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
  }

  toggleSubmenu(label: string) {
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  isSubmenuExpanded(label: string): boolean {
    return !!this.expandedMenus[label];
  }

  get isOpen(): boolean {
    return this.isExpanded || this.isHovering;
  }

  employeeSidebar(): SidebarItem[] {
    const base = '/employee';
    return [
      { label: 'Dashboard', icon: 'fas fa-gauge-high', route: `${base}/dashboard`, fragment: 'dashboard-top', exact: true },
      { label: 'Mon Compte', icon: 'fas fa-circle-user', route: `${base}/account`, exact: true },
      {
        label: 'Mes Missions',
        icon: 'fas fa-clipboard-list',
        route: `${base}/dashboard`,
        children: [
          { label: 'Creer', icon: 'fas fa-plus', route: `${base}/dashboard`, fragment: 'create-mission' },
          { label: 'Historique', icon: 'fas fa-clock-rotate-left', route: `${base}/missions/history`, exact: true },
        ],
      },
      { label: 'Parking', icon: 'fas fa-square-parking', route: `${base}/parking`, exact: true },
    ];
  }

  responsableSidebar(): SidebarItem[] {
    const base = '/responsable';
    return [
      { label: 'Dashboard', icon: 'fas fa-gauge-high', route: `${base}/dashboard`, fragment: 'dashboard-top', exact: true },
      { label: 'Mon Compte', icon: 'fas fa-circle-user', route: `${base}/account`, exact: true },
      {
        label: 'Gestion Missions',
        icon: 'fas fa-clipboard-check',
        route: `${base}/dashboard`,
        children: [
          { label: 'Suivre Missions', icon: 'fas fa-list-check', route: `${base}/dashboard`, fragment: 'mission-validation' },
          { label: 'Historique', icon: 'fas fa-clock-rotate-left', route: `${base}/missions/history`, exact: true },
        ],
      },
      {
        label: 'Gestion Parking',
        icon: 'fas fa-square-parking',
        route: `${base}/dashboard`,
        children: [
          { label: 'Voir Parking', icon: 'fas fa-map-location-dot', route: `${base}/parking` },
          { label: 'Gerer Vehicules', icon: 'fas fa-car', route: `${base}/create-vehicle`, exact: true },
        ],
      },
      {
        label: 'Gestion Users',
        icon: 'fas fa-users-gear',
        route: `${base}/dashboard`,
        children: [
          { label: 'Voir Users', icon: 'fas fa-users', route: `${base}/dashboard`, fragment: 'users-management' },
          { label: 'Gérer Users', icon: 'fas fa-user-plus', route: `${base}/create-account`, exact: true },
        ],
      },
      { label: 'Statistiques', icon: 'fas fa-chart-line', route: `${base}/statistiques`, exact: true },
    ];
  }

  logout() {
    this.authSessionService.clearSession();
    localStorage.removeItem('sidebarExpanded');
    this.router.navigate(['/login']);
  }

  onItemClick(event: MouseEvent, item: SidebarItem): void {
    if (!item.children?.length) {
      return;
    }

    // Keep parent menu item focused on toggling submenu only.
    event.preventDefault();
    event.stopPropagation();
    this.toggleSubmenu(item.label);
  }

  onLeafItemClick(event: MouseEvent, item: SidebarItem): void {
    if (!item.fragment) {
      return;
    }

    const [currentPath] = this.router.url.split('#');
    if (currentPath !== item.route) {
      return;
    }

    // Force smooth scrolling when clicking a fragment link on the same page.
    event.preventDefault();
    const section = document.getElementById(item.fragment);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    void this.router.navigate([], { fragment: item.fragment });
  }

  isNavItemActive(item: SidebarItem): boolean {
    if (item.children?.length) {
      return item.children.some((child) => this.isLeafItemActive(child));
    }

    return this.isLeafItemActive(item);
  }

  private isLeafItemActive(item: SidebarItem): boolean {
    const [currentPath, currentFragment = ''] = this.router.url.split('#');

    if (item.fragment) {
      return currentPath === item.route && currentFragment === item.fragment;
    }

    if (item.exact) {
      return currentPath === item.route;
    }

    return currentPath.startsWith(item.route);
  }
}
