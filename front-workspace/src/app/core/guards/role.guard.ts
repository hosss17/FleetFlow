import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

function hasRole(expectedRole: 'employee' | 'responsable'): boolean {
  const role = (localStorage.getItem('currentRole') ?? '').toLowerCase();
  return role === expectedRole;
}

export const employeeOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (hasRole('employee')) {
    return true;
  }

  if (hasRole('responsable')) {
    return router.parseUrl('/responsable/dashboard');
  }

  return router.parseUrl('/login');
};

export const responsableOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (hasRole('responsable')) {
    return true;
  }

  if (hasRole('employee')) {
    return router.parseUrl('/employee/dashboard');
  }

  return router.parseUrl('/login');
};
