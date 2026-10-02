import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../shared/utils/http-error.utils';
import { AuthCardComponent } from '../../components/auth-card/auth-card.component';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-auth-card titulo="Recupera tu contraseña" subtitulo="Ingresa tu usuario o tu correo y te enviaremos un enlace para crear una nueva.">
            @if (enviado()) {
                <div role="status" class="rounded-lg bg-[#E8ECF3] p-4 text-sm">
                    Si los datos son correctos, enviamos las instrucciones al correo registrado.
                    El enlace vence en pocos minutos y solo se puede usar una vez.
                </div>
                <a routerLink="/auth/login" class="btn btn-ip mt-6 w-full">Volver a iniciar sesión</a>
            } @else {
                <form [formGroup]="form" (ngSubmit)="enviar()" class="grid gap-4">
                    <label class="form-control">
                        <span class="label-text mb-1 text-sm font-semibold">Usuario o correo</span>
                        <input class="input input-bordered w-full" formControlName="identificador" autocomplete="username" />
                    </label>

                    @if (error(); as e) {
                        <div role="alert" class="alert alert-error"><span>{{ e }}</span></div>
                    }

                    <button type="submit" class="btn btn-ip w-full" [disabled]="cargando()">
                        @if (cargando()) { <span class="loading loading-spinner loading-sm"></span> }
                        Enviar enlace
                    </button>
                    <a routerLink="/auth/login" class="text-center text-sm text-[#1B4589] hover:underline">Volver a iniciar sesión</a>
                </form>
            }
        </app-auth-card>
    `,
})
export class ForgotPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);

    readonly cargando = signal(false);
    readonly enviado = signal(false);
    readonly error = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        identificador: ['', [Validators.required, Validators.maxLength(150)]],
    });

    enviar(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.error.set('Ingresa tu usuario o correo.');
            return;
        }

        this.cargando.set(true);
        this.error.set(null);

        // El backend responde igual exista o no la cuenta, para no revelar usuarios
        this.auth.forgotPassword(this.form.getRawValue().identificador.trim()).subscribe({
            next: () => {
                this.cargando.set(false);
                this.enviado.set(true);
            },
            error: e => {
                this.cargando.set(false);
                this.error.set(mensajeError(e, 'No se pudo procesar la solicitud. Intenta nuevamente.'));
            },
        });
    }
}
