import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/auth.interface copy';
import { authResponse } from '../../interfaces/auth-response.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { IconsComponent } from '../../../../shared/icons/icons.component';
import { RepeatedMethodUtils } from '../../../../shared/utils/repeated-method.utils';
import { LoginIconComponent } from '../../components/login-icon/login-icon.component';
import { CarruselComponent } from '../../components/carrusel/carrusel.component';

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
    isLoading = signal<boolean>(false);
    private authService = inject(AuthService);
    public router = inject(Router);
    public readonly alertType = signal<'warning' | 'danger'>('danger');
    activeSlide = signal(0);
    public repeatMethodUtils = RepeatedMethodUtils;


    loginForm = this.fb.group({
        username: [''],
        password: [''],
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



        this.isLoading.set(true);

        const user: User = {
            username: this.loginForm.value.username!,
            password: this.loginForm.value.password!,
        };

        this.authService.login(user).subscribe({
            next: (response: authResponse) => {
                this.isLoading.set(false);
                
                if (response.success === 1) {
                    this.router.navigateByUrl('/system');
                    return;
                }

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
