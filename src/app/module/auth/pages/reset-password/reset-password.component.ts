import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensajeError } from '../../../../shared/utils/http-error.utils';
import { AuthCardComponent } from '../../components/auth-card/auth-card.component';
import { AuthService } from '../../services/auth.service';

// Misma política que el backend (ValidadorClave): 8+ caracteres con mayúscula, minúscula y número
function politicaClave(control: AbstractControl): ValidationErrors | null {
    const v: string = control.value ?? '';
    if (v.length < 8) return { politica: 'Debe tener al menos 8 caracteres.' };
    if (new TextEncoder().encode(v).length > 72) return { politica: 'Es demasiado larga (máximo 72 bytes).' };
    if (!/[A-ZÁÉÍÓÚÑ]/.test(v) || !/[a-záéíóúñ]/.test(v) || !/\d/.test(v)) {
        return { politica: 'Debe incluir mayúsculas, minúsculas y números.' };
    }
    return null;
}

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink, AuthCardComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-auth-card titulo="Define tu contraseña" subtitulo="Elige una contraseña nueva para tu cuenta.">
            @if (listo()) {
                <div role="status" class="rounded-lg bg-[#E8ECF3] p-4 text-sm">
                    Tu contraseña quedó actualizada. Ya puedes iniciar sesión.
                </div>
                <a routerLink="/auth/login" class="btn btn-ip mt-6 w-full">Iniciar sesión</a>
            } @else if (!token()) {
                <div role="alert" class="alert alert-warning"><span>
                    El enlace no es válido. Solicita uno nuevo desde "Olvidé mi contraseña".
                </span></div>
                <a routerLink="/auth/forgot-password" class="btn btn-ip mt-6 w-full">Solicitar nuevo enlace</a>
            } @else {
                <form [formGroup]="form" (ngSubmit)="guardar()" class="grid gap-4">
                    <label class="form-control">
                        <span class="label-text mb-1 text-sm font-semibold">Nueva contraseña</span>
                        <input class="input input-bordered w-full" type="password" formControlName="nuevaClave" autocomplete="new-password" />
                        @if (form.controls.nuevaClave.touched && form.controls.nuevaClave.errors?.['politica']; as msg) {
                            <span class="mt-1 text-xs text-error">{{ msg }}</span>
                        } @else {
                            <span class="mt-1 text-xs text-slate-500">Mínimo 8 caracteres, con mayúsculas, minúsculas y números.</span>
                        }
                    </label>
                    <label class="form-control">
                        <span class="label-text mb-1 text-sm font-semibold">Repite la contraseña</span>
                        <input class="input input-bordered w-full" type="password" formControlName="confirmar" autocomplete="new-password" />
                        @if (form.controls.confirmar.touched && !coinciden()) {
                            <span class="mt-1 text-xs text-error">Las contraseñas no coinciden.</span>
                        }
                    </label>

                    @if (error(); as e) {
                        <div role="alert" class="alert alert-error"><span>{{ e }}</span></div>
                    }

                    <button type="submit" class="btn btn-ip w-full" [disabled]="cargando()">
                        @if (cargando()) { <span class="loading loading-spinner loading-sm"></span> }
                        Guardar contraseña
                    </button>
                </form>
            }
        </app-auth-card>
    `,
})
export class ResetPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);

    readonly token = signal<string>(this.route.snapshot.queryParamMap.get('token') ?? '');
    readonly cargando = signal(false);
    readonly listo = signal(false);
    readonly error = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        nuevaClave: ['', [Validators.required, politicaClave]],
        confirmar: ['', [Validators.required]],
    });

    readonly coinciden = computed(() => {
        const v = this.form.getRawValue();
        return v.nuevaClave === v.confirmar;
    });

    guardar(): void {
        this.form.markAllAsTouched();
        const v = this.form.getRawValue();

        if (this.form.invalid || v.nuevaClave !== v.confirmar) {
            this.error.set(v.nuevaClave !== v.confirmar ? 'Las contraseñas no coinciden.' : 'Revisa la contraseña ingresada.');
            return;
        }

        this.cargando.set(true);
        this.error.set(null);

        this.auth.resetPassword(this.token(), v.nuevaClave).subscribe({
            next: () => {
                this.cargando.set(false);
                this.listo.set(true);
            },
            error: e => {
                this.cargando.set(false);
                this.error.set(mensajeError(e, 'No se pudo actualizar la contraseña.'));
            },
        });
    }
}
