import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/auth.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { IconsComponent } from '../../../../shared/icons/icons.component';
import { RepeatedMethodUtils } from '../../../../shared/utils/repeated-method.utils';
import { LoginIconComponent } from '../../components/login-icon/login-icon.component';
import { CarruselComponent } from '../../components/carrusel/carrusel.component';
import { AuthResponse } from '../../interfaces/auth-response.interface';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule, IconsComponent, LoginIconComponent, CarruselComponent],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.css',
})
export class LoginPageComponent { 
    private fb = inject(FormBuilder);
    hasError = signal<boolean>(false);
    submitted = signal<boolean>(false);
    errorMessage = signal<string>('Por favor revise sus credenciales.');
    private readonly loadingService = inject(LoadingService);
    readonly isLoading = this.loadingService.loginInProgress;
    private authService = inject(AuthService);
    public router = inject(Router);
    public readonly alertType = signal<'warning' | 'danger'>('danger');
    activeSlide = signal(0);
    public repeatMethodUtils = RepeatedMethodUtils;


    loginForm = this.fb.group({
        UsuarioLogin: [''],
        Clave: [''],
    });



    public onSubmit() {
        this.submitted.set(true);

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        if (this.isLoading()) {
            return;
        }



        this.hasError.set(false);
        this.isLoading.set(true);

        const user: User = {
            UsuarioLogin: this.loginForm.value.UsuarioLogin!,
            Clave: this.loginForm.value.Clave!,
        };

        this.authService.login(user).subscribe({
            next: (response: AuthResponse) => {
                if (response.estado === 1) {
                    this.router.navigateByUrl('/system')
                        .catch(() => {
                            this.errorMessage.set('No se pudo abrir el portal. Intenta nuevamente.');
                            this.hasError.set(true);
                        })
                        .finally(() => this.isLoading.set(false));
                    return;
                }

                this.isLoading.set(false);
                this.errorMessage.set('El servidor no confirmó el inicio de sesión.');
                this.alertType.set('warning');
                this.hasError.set(true);
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading.set(false);

                this.repeatMethodUtils.loginError(err);

                this.errorMessage.set(err?.error?.message ?? 'No fue posible iniciar sesión.');
                this.alertType.set('danger');
                this.hasError.set(true);
            },
        });
    }



}
