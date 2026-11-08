import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TelegramLinkStatus {
  linked: boolean;
  telegramIdMasked: string | null;
  linkedAt: string | null;
}

export interface TelegramCodeResponse {
  code: string;
  expiresAt: string;
  instructions: string;
}

export interface TelegramMessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class TelegramLinkApiService {
  private readonly baseUrl = `${environment.apiUrl}/telegram-link`;

  constructor(private readonly http: HttpClient) {}

  getStatus(): Observable<TelegramLinkStatus> {
    return this.http.get<TelegramLinkStatus>(`${this.baseUrl}/status`);
  }

  generateCode(): Observable<TelegramCodeResponse> {
    return this.http.post<TelegramCodeResponse>(`${this.baseUrl}/code`, {});
  }

  unlink(): Observable<TelegramMessageResponse> {
    return this.http.post<TelegramMessageResponse>(`${this.baseUrl}/unlink`, {});
  }
}
