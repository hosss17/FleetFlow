import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);
  const token = authSessionService.getAccessToken();
  const isApiRequest = req.url.includes('/api/');
  const isAuthRoute = req.url.includes('/api/auth/login')
    || req.url.includes('/api/auth/register')
    || req.url.includes('/api/auth/refresh');

  // Only attach token to backend API calls when a token exists.
  if (!token || !isApiRequest) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRoute) {
        return throwError(() => error);
      }

      return authSessionService.refreshAccessToken().pipe(
        switchMap((newToken) => {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          return next(retryReq);
        }),
        catchError((refreshError) => {
          authSessionService.clearSession();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
