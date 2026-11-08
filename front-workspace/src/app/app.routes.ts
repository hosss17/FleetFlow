import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { EmployeeDashboardComponent } from './features/dashboard/employee-dashboard/employee-dashboard.component';
import { ResponsableDashboardComponent } from './features/dashboard/responsable-dashboard/responsable-dashboard.component';
import { EmployeeAccountComponent } from './features/dashboard/employee-account/employee-account.component';
import { EmployeeParkingComponent } from './features/dashboard/employee-parking/employee-parking.component';
import { EmployeeMissionHistoryComponent } from './features/dashboard/employee-mission-history/employee-mission-history.component';
import { ResponsableAccountComponent } from './features/dashboard/responsable-account/responsable-account.component';
import { ResponsableCreateAccountComponent } from './features/dashboard/responsable-create-account/responsable-create-account.component';
import { ResponsableCreateVehicleComponent } from './features/dashboard/responsable-create-vehicle/responsable-create-vehicle.component';
import { ResponsableParkingComponent } from './features/dashboard/responsable-parking/responsable-parking.component';
import { ResponsableMissionHistoryComponent } from './features/dashboard/responsable-mission-history/responsable-mission-history.component';
import { ResponsableStatisticsComponent } from './features/dashboard/responsable-statistics/responsable-statistics.component';
import { employeeOnlyGuard, responsableOnlyGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  { path: 'employee/dashboard', component: EmployeeDashboardComponent, canActivate: [employeeOnlyGuard] },
  { path: 'employee/account', component: EmployeeAccountComponent, canActivate: [employeeOnlyGuard] },
  { path: 'employee/parking', component: EmployeeParkingComponent, canActivate: [employeeOnlyGuard] },
  { path: 'employee/missions/history', component: EmployeeMissionHistoryComponent, canActivate: [employeeOnlyGuard] },
  { path: 'employee', component: EmployeeDashboardComponent, canActivate: [employeeOnlyGuard] },
  { path: 'responsable/dashboard', component: ResponsableDashboardComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable/account', component: ResponsableAccountComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable/create-account', component: ResponsableCreateAccountComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable/create-vehicle', component: ResponsableCreateVehicleComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable/parking', component: ResponsableParkingComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable/missions/history', component: ResponsableMissionHistoryComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable/statistiques', component: ResponsableStatisticsComponent, canActivate: [responsableOnlyGuard] },
  { path: 'responsable', component: ResponsableDashboardComponent, canActivate: [responsableOnlyGuard] },
  { path: '**', redirectTo: 'login' }
];