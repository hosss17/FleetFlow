export type UserRole = 'employee' | 'responsable';
export type MissionStatus = 'EN_ATTENTE' | 'APPROUVEE' | 'TERMINEE' | 'REFUSEE' | 'ECHOUEE';
export type ReservationStatus = 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';
export type VehicleStatus = 'DISPONIBLE' | 'RESERVE' | 'MAINTENANCE';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
}

export interface MissionRequest {
  id: string;
  employee: Pick<AppUser, 'id' | 'name'>;
  destination: string;
  objective: string;
  startDate: string;
  endDate: string;
  priority: 'URGENT' | 'NORMAL';
  needsVehicle: boolean;
  status: MissionStatus;
  createdAt: string;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  qrPayload?: string;
  qrCodeDataUrl?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: 'SUV' | 'BERLINE' | 'UTILITAIRE';
  status: VehicleStatus;
  kilometrage?: number;
}

export interface VehicleReservation {
  id: string;
  employee: Pick<AppUser, 'id' | 'name'>;
  requestedType: Vehicle['type'];
  fromDate: string;
  toDate: string;
  reason: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface ProblemReport {
  id: string;
  employee: Pick<AppUser, 'id' | 'name'>;
  category: 'MECANIQUE' | 'PARKING' | 'SECURITE';
  severity: 'FAIBLE' | 'MOYENNE' | 'CRITIQUE';
  description: string;
  relatedVehicleId?: string;
  status: 'OUVERT' | 'EN_COURS' | 'RESOLU';
  createdAt: string;
}

export interface CreateEmployeeAccountInput {
  name: string;
  email: string;
  password?: string;
  active?: boolean;
}

export interface CreateEmployeeAccountResult {
  ok: boolean;
  user?: AppUser;
  error?: string;
}
