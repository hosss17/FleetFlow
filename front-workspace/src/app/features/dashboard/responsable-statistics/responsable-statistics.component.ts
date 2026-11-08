import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Vehicle } from '../../../core/models/logistics.models';
import { VehicleApiService } from '../../../core/services/vehicle-api.service';
import { MissionApiService, MissionRequestView } from '../../../core/services/mission-api.service';

interface StatSlice {
  label: string;
  count: number;
  percent: number;
  color: string;
}

interface EmployeeSuccessStat {
  employeeId: string;
  employeeName: string;
  completed: number;
  failed: number;
  totalClosed: number;
  successRate: number;
}

interface SummaryKpi {
  label: string;
  value: string;
  trend: string;
  icon: string;
  tone: 'navy' | 'red' | 'green' | 'amber';
}

interface MaintenanceStat {
  label: string;
  count: number;
  hint: string;
  color: string;
}

@Component({
  selector: 'app-responsable-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsable-statistics.component.html',
  styleUrls: ['./responsable-statistics.component.css']
})
export class ResponsableStatisticsComponent {
  isLoading = true;
  loadError = '';

  missions: MissionRequestView[] = [];
  vehicles: Vehicle[] = [];

  summaryKpis: SummaryKpi[] = [];
  missionPriorityDistribution: StatSlice[] = [];
  missionStatusDistribution: StatSlice[] = [];
  vehicleUtilizationDistribution: StatSlice[] = [];
  employeeSuccessStats: EmployeeSuccessStat[] = [];
  maintenanceOutlook: MaintenanceStat[] = [];
  overallMissionSuccessRate = 0;

  constructor(
    private readonly missionApiService: MissionApiService,
    private readonly vehicleApiService: VehicleApiService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.reloadStats();
  }

  async downloadPdf(): Promise<void> {
    // dynamic import to avoid build break if dependency not yet installed
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(14);
    doc.text('Rapport — Statistiques Responsable', 14, 20);

    // Missions table
    const head = [['Mission', 'Statut', 'Priorite', 'Employee', 'Date']];
    const body = (this.missions || []).map(m => [
      // use existing MissionRequestView fields: destination as mission label
      m.destination ?? m.objective ?? m.id?.toString() ?? '',
      m.status ?? '',
      m.priority ?? '',
      m.employee?.name ?? '',
      m.startDate ? new Date(m.startDate).toLocaleDateString() : ''
    ]);

    // add small table if there are missions, otherwise add a short note
    if (body.length > 0) {
      (doc as any).autoTable({
        head,
        body,
        startY: 30,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] }
      });
    } else {
      doc.setFontSize(11);
      doc.text('Aucune mission disponible pour l export.', 14, 40);
    }

    // Small footer with counts
    const y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 90;
    doc.setFontSize(10);
    doc.text(`Missions totales: ${this.missions.length}`, 14, y);
    doc.text(`Vehicules: ${this.vehicles.length}`, 90, y);

    doc.save('statistiques_responsable.pdf');
  }

  reloadStats(): void {
    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      missions: this.missionApiService.getAllMissionViews(),
      vehicles: this.vehicleApiService.getAllVehicles()
    }).subscribe({
      next: ({ missions, vehicles }) => {
        this.missions = missions;
        this.vehicles = vehicles;
        this.computeStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'Impossible de charger les statistiques pour le moment.';
      }
    });
  }

  donutGradient(slices: StatSlice[]): string {
    if (slices.length === 0) {
      return 'conic-gradient(#e2e8f0 0 100%)';
    }

    let start = 0;
    const parts = slices.map((slice) => {
      const end = start + slice.percent;
      const part = `${slice.color} ${start}% ${end}%`;
      start = end;
      return part;
    });

    if (start < 100) {
      parts.push(`#e2e8f0 ${start}% 100%`);
    }

    return `conic-gradient(${parts.join(', ')})`;
  }

  successBarWidth(successRate: number): string {
    return `${Math.max(0, Math.min(100, successRate))}%`;
  }

  toneClass(tone: SummaryKpi['tone']): string {
    const classes: Record<SummaryKpi['tone'], string> = {
      navy: 'kpi-navy',
      red: 'kpi-red',
      green: 'kpi-green',
      amber: 'kpi-amber'
    };

    return classes[tone];
  }

  private computeStats(): void {
    this.computeSummaryKpis();
    this.computeMissionDistributions();
    this.computeVehicleDistribution();
    this.computeEmployeePerformance();
    this.computeMaintenanceOutlook();
  }

  private computeSummaryKpis(): void {
    const total = this.missions.length;
    const pending = this.countMissionsByStatus('EN_ATTENTE');
    const completed = this.countMissionsByStatus('TERMINEE');
    const failed = this.countMissionsByStatus('ECHOUEE');
    const closed = completed + failed;

    this.overallMissionSuccessRate = this.percent(completed, closed || 1);

    this.summaryKpis = [
      {
        label: 'Missions totales',
        value: String(total),
        trend: `${pending} en attente`,
        icon: 'fa-solid fa-briefcase',
        tone: 'navy'
      },
      {
        label: 'Taux de reussite global',
        value: `${this.overallMissionSuccessRate}%`,
        trend: `${completed} terminees / ${failed} echouees`,
        icon: 'fa-solid fa-bullseye',
        tone: 'green'
      },
      {
        label: 'Missions urgentes',
        value: String(this.missions.filter((mission) => mission.priority === 'URGENT').length),
        trend: `priorite URGENT`,
        icon: 'fa-solid fa-triangle-exclamation',
        tone: 'red'
      },
      {
        label: 'Disponibilite parc',
        value: `${this.percent(this.vehicles.filter((vehicle) => vehicle.status === 'DISPONIBLE').length, this.vehicles.length || 1)}%`,
        trend: `${this.vehicles.length} vehicules`,
        icon: 'fa-solid fa-car-side',
        tone: 'amber'
      }
    ];
  }

  private computeMissionDistributions(): void {
    const totalMissions = this.missions.length || 1;
    const urgent = this.missions.filter((mission) => mission.priority === 'URGENT').length;
    const normal = Math.max(0, this.missions.length - urgent);

    this.missionPriorityDistribution = [
      { label: 'Urgent', count: urgent, percent: this.percent(urgent, totalMissions), color: '#d7263d' },
      { label: 'Normal', count: normal, percent: this.percent(normal, totalMissions), color: '#f59e0b' }
    ];

    const pending = this.countMissionsByStatus('EN_ATTENTE');
    const completed = this.countMissionsByStatus('TERMINEE');
    const failed = this.countMissionsByStatus('ECHOUEE');
    const refused = this.countMissionsByStatus('REFUSEE');

    this.missionStatusDistribution = [
      { label: 'En attente', count: pending, percent: this.percent(pending, totalMissions), color: '#f59e0b' },
      { label: 'Terminees', count: completed, percent: this.percent(completed, totalMissions), color: '#16a34a' },
      { label: 'Echouees', count: failed, percent: this.percent(failed, totalMissions), color: '#dc2626' },
      { label: 'Refusees', count: refused, percent: this.percent(refused, totalMissions), color: '#6b7280' }
    ];
  }

  private computeVehicleDistribution(): void {
    const totalVehicles = this.vehicles.length || 1;
    const available = this.vehicles.filter((vehicle) => vehicle.status === 'DISPONIBLE').length;
    const reserved = this.vehicles.filter((vehicle) => vehicle.status === 'RESERVE').length;
    const maintenance = this.vehicles.filter((vehicle) => vehicle.status === 'MAINTENANCE').length;

    this.vehicleUtilizationDistribution = [
      { label: 'Disponibles', count: available, percent: this.percent(available, totalVehicles), color: '#16a34a' },
      { label: 'Reserve/Utilise', count: reserved, percent: this.percent(reserved, totalVehicles), color: '#2563eb' },
      { label: 'Maintenance', count: maintenance, percent: this.percent(maintenance, totalVehicles), color: '#f59e0b' }
    ];
  }

  private computeEmployeePerformance(): void {
    const outcomes = new Map<string, EmployeeSuccessStat>();

    for (const mission of this.missions) {
      if (mission.status !== 'TERMINEE' && mission.status !== 'ECHOUEE') {
        continue;
      }

      const key = mission.employee.id;
      const current = outcomes.get(key) ?? {
        employeeId: key,
        employeeName: mission.employee.name,
        completed: 0,
        failed: 0,
        totalClosed: 0,
        successRate: 0
      };

      if (mission.status === 'TERMINEE') {
        current.completed += 1;
      } else {
        current.failed += 1;
      }

      current.totalClosed = current.completed + current.failed;
      current.successRate = this.percent(current.completed, current.totalClosed || 1);
      outcomes.set(key, current);
    }

    this.employeeSuccessStats = [...outcomes.values()]
      .sort((left, right) => {
        if (right.successRate !== left.successRate) {
          return right.successRate - left.successRate;
        }
        return right.totalClosed - left.totalClosed;
      })
      .slice(0, 8);
  }

  private computeMaintenanceOutlook(): void {
    const reserved = this.vehicles.filter((vehicle) => vehicle.status === 'RESERVE').length;
    const maintenance = this.vehicles.filter((vehicle) => vehicle.status === 'MAINTENANCE').length;

    this.maintenanceOutlook = [
      {
        label: 'Vidange a planifier (30j)',
        count: reserved,
        hint: 'Projection basee sur les vehicules utilises/reserves actuellement.',
        color: '#2563eb'
      },
      {
        label: 'Inspection technique (30j)',
        count: maintenance,
        hint: 'Projection basee sur les vehicules deja en maintenance.',
        color: '#f59e0b'
      },
      {
        label: 'Suivi garantie (30j)',
        count: Math.min(this.vehicles.length, Math.ceil(this.vehicles.length * 0.15)),
        hint: 'Estimation initiale en attente des vraies dates de garantie.',
        color: '#d7263d'
      }
    ];
  }

  private countMissionsByStatus(status: MissionRequestView['status']): number {
    return this.missions.filter((mission) => mission.status === status).length;
  }

  private percent(value: number, total: number): number {
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }
}
