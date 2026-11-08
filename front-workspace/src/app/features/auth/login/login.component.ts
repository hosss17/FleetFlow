import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  authError = '';
  isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authApiService: AuthApiService,
    private readonly authSessionService: AuthSessionService
  ) {
    this.loginForm = this.fb.group({
      email: [ '', [Validators.required, Validators.email, Validators.pattern(String.raw`^[a-zA-Z0-9._%+-]+@attijari\.com$`)] ],
      password: [ '', [Validators.required, Validators.minLength(6)] ],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.authError = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.authError = 'Veuillez saisir des informations de connexion valides.';
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isLoading = true;

    this.authApiService.login({ email, password }).subscribe({
      next: (response) => {
        const role = response.role === 'RESPONSABLE' ? 'responsable' : 'employee';
        const targetUrl = role === 'responsable' ? '/responsable/dashboard' : '/employee/dashboard';

        this.authSessionService.setLoginSession(response);
        this.isLoading = false;

        this.router.navigateByUrl(targetUrl, { replaceUrl: true }).then((navigated) => {
          if (!navigated) {
            globalThis.location.assign(targetUrl);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.authError = 'Email ou mot de passe invalide.';
          return;
        }

        if (error.status === 403) {
          this.authError = 'Votre compte est desactive. Contactez un administrateur.';
          return;
        }

        if (error.status === 0) {
          this.authError = 'Serveur indisponible. Verifiez que le backend est demarre.';
          return;
        }

        this.authError = 'Erreur serveur. Veuillez reessayer.';
      }
    });
  }
}
