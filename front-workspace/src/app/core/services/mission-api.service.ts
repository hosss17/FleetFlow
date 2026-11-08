import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/logistics.models';

export interface MissionRef {
	id: number;
}

export interface MissionApiModel {
	id?: number;
	title: string;
	description?: string;
	user: MissionRef;
	vehicle?: MissionRef | null;
	priority: 'URGENT' | 'NORMAL';
	status: 'EN_ATTENTE' | 'APPROUVEE' | 'TERMINEE' | 'ECHOUEE' | 'REFUSEE';
	needsVehicle?: boolean;
	rejectionReason?: string;
	startDatetime: string;
	endDatetime: string;
	createdAt?: string;
}

export interface MissionRequestView {
	id: string;
	employee: Pick<AppUser, 'id' | 'name'>;
	destination: string;
	objective: string;
	startDate: string;
	endDate: string;
	priority: 'URGENT' | 'NORMAL';
	needsVehicle: boolean;
	status: 'EN_ATTENTE' | 'APPROUVEE' | 'TERMINEE' | 'REFUSEE' | 'ECHOUEE';
	createdAt: string;
	assignedVehicleId?: string;
	assignedVehiclePlate?: string;
	rejectionReason?: string;
	qrPayload?: string;
	qrCodeDataUrl?: string;
}

interface BackendMissionApiModel extends MissionApiModel {
	user: {
		id: number;
		name: string;
	};
	vehicle?: {
		id: number;
		model?: string;
		matricule?: string;
	} | null;
}

@Injectable({ providedIn: 'root' })
export class MissionApiService {
	private readonly baseUrl = `${environment.apiUrl}/missions`;

	constructor(private readonly http: HttpClient) {}

	getAllMissions(): Observable<MissionApiModel[]> {
		return this.http.get<MissionApiModel[]>(this.baseUrl);
	}

	getAllMissionViews(): Observable<MissionRequestView[]> {
		return this.http.get<BackendMissionApiModel[]>(this.baseUrl).pipe(
			map((missions) => missions.map((mission) => this.toMissionView(mission)))
		);
	}

	getMissionById(id: number): Observable<MissionApiModel> {
		return this.http.get<MissionApiModel>(`${this.baseUrl}/${id}`);
	}

	createMission(payload: MissionApiModel): Observable<MissionApiModel> {
		return this.http.post<MissionApiModel>(this.baseUrl, payload);
	}

	updateMission(id: number, payload: MissionApiModel): Observable<MissionApiModel> {
		return this.http.put<MissionApiModel>(`${this.baseUrl}/${id}`, payload);
	}

	deleteMission(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}

	getMissionsByUserId(userId: number): Observable<MissionApiModel[]> {
		return this.http.get<MissionApiModel[]>(`${this.baseUrl}/user/${userId}`);
	}

	getMissionViewsByUserId(userId: number): Observable<MissionRequestView[]> {
		return this.http.get<BackendMissionApiModel[]>(`${this.baseUrl}/user/${userId}`).pipe(
			map((missions) => missions.map((mission) => this.toMissionView(mission)))
		);
	}

	getPendingMissions(): Observable<MissionApiModel[]> {
		return this.http.get<MissionApiModel[]>(`${this.baseUrl}/status/pending`);
	}

	createMissionRequest(payload: {
		employeeId: number;
		destination: string;
		objective: string;
		startDate: string;
		endDate: string;
		priority: 'URGENT' | 'NORMAL';
		needsVehicle: boolean;
	}): Observable<MissionRequestView> {
		const requestPayload: MissionApiModel = {
			title: payload.destination.trim(),
			description: payload.objective.trim(),
			user: { id: payload.employeeId },
			vehicle: null,
			priority: payload.priority,
			status: 'EN_ATTENTE',
			needsVehicle: payload.needsVehicle,
			startDatetime: `${payload.startDate}T00:00:00`,
			endDatetime: `${payload.endDate}T23:59:59`
		};

		return this.http.post<BackendMissionApiModel>(this.baseUrl, requestPayload).pipe(
			map((mission) => this.toMissionView(mission))
		);
	}

	approveMission(missionId: number, vehicleId?: number): Observable<MissionRequestView> {
		return this.http.put<BackendMissionApiModel>(`${this.baseUrl}/${missionId}/approve`, { vehicleId: vehicleId ?? null }).pipe(
			map((mission) => this.toMissionView(mission))
		);
	}

	rejectMission(missionId: number, reason?: string): Observable<MissionRequestView> {
		return this.http.put<BackendMissionApiModel>(`${this.baseUrl}/${missionId}/reject`, { rejectionReason: reason ?? '' }).pipe(
			map((mission) => this.toMissionView(mission))
		);
	}

	setMissionOutcome(missionId: number, status: 'TERMINEE' | 'ECHOUEE'): Observable<MissionRequestView> {
		return this.http.put<BackendMissionApiModel>(`${this.baseUrl}/${missionId}/outcome`, { status }).pipe(
			map((mission) => this.toMissionView(mission))
		);
	}

	private toMissionView(mission: BackendMissionApiModel): MissionRequestView {
		const hasVehicle = !!mission.vehicle;
		let mappedStatus: MissionRequestView['status'] = mission.status as MissionRequestView['status'];
		const qrPayload = hasVehicle ? `${mission.id}|${mission.vehicle?.id}|${mission.endDatetime}` : undefined;

		return {
			id: String(mission.id ?? ''),
			employee: {
				id: String(mission.user?.id ?? ''),
				name: mission.user?.name ?? 'N/A'
			},
			destination: mission.title,
			objective: mission.description ?? '',
			startDate: mission.startDatetime.slice(0, 10),
			endDate: mission.endDatetime.slice(0, 10),
			priority: mission.priority,
			needsVehicle: mission.needsVehicle ?? false,
			status: mappedStatus,
			createdAt: mission.createdAt ?? mission.startDatetime,
			assignedVehicleId: mission.vehicle?.id ? String(mission.vehicle.id) : undefined,
			assignedVehiclePlate: mission.vehicle
				? (mission.vehicle.model?.trim()
					? `${mission.vehicle.model} (${mission.vehicle.matricule ?? 'Sans matricule'})`
					: mission.vehicle.matricule)
				: undefined,
			rejectionReason: mission.rejectionReason,
			qrPayload,
			qrCodeDataUrl: qrPayload ? this.generateQrDataUrl(qrPayload) : undefined
		};
	}

	private generateQrDataUrl(payload: string): string {
		const matrixSize = 21;
		const moduleSize = 8;
		const quietZone = 2;
		const fullSize = (matrixSize + quietZone * 2) * moduleSize;

		const modules: string[] = [];
		for (let y = 0; y < matrixSize; y += 1) {
			for (let x = 0; x < matrixSize; x += 1) {
				const finderZone = this.isFinderZone(x, y, matrixSize);
				const dark = finderZone || this.seededBit(payload, x, y);
				if (dark) {
					const px = (x + quietZone) * moduleSize;
					const py = (y + quietZone) * moduleSize;
					modules.push(`<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="#111827"/>`);
				}
			}
		}

		const svg = [
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullSize} ${fullSize}" role="img" aria-label="Parking QR code">`,
			`<rect width="${fullSize}" height="${fullSize}" fill="#ffffff"/>`,
			...modules,
			'</svg>'
		].join('');

		return `data:image/svg+xml;base64,${btoa(svg)}`;
	}

	private seededBit(seed: string, x: number, y: number): boolean {
		let hash = 0;
		const source = `${seed}:${x}:${y}`;
		for (let i = 0; i < source.length; i += 1) {
			const codePoint = source.codePointAt(i) ?? 0;
			hash = Math.trunc(((hash << 5) - hash) + codePoint);
		}
		return Math.abs(hash) % 3 === 0;
	}

	private isFinderZone(x: number, y: number, size: number): boolean {
		const inTopLeft = x <= 6 && y <= 6;
		const inTopRight = x >= size - 7 && y <= 6;
		const inBottomLeft = x <= 6 && y >= size - 7;
		return this.finderPattern(x, y, 0, 0, inTopLeft)
			|| this.finderPattern(x, y, size - 7, 0, inTopRight)
			|| this.finderPattern(x, y, 0, size - 7, inBottomLeft);
	}

	private finderPattern(x: number, y: number, x0: number, y0: number, active: boolean): boolean {
		if (!active) {
			return false;
		}

		const dx = x - x0;
		const dy = y - y0;
		const outer = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
		const inner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
		const ring = (dx === 0 || dx === 6 || dy === 0 || dy === 6)
			|| (dx === 1 || dx === 5 || dy === 1 || dy === 5);

		return outer && (inner || ring);
	}
}
