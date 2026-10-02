import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { mensajeError } from '../../../../../shared/utils/http-error.utils';
import { ReniecPersona, ReniecResponse } from '../../../interfaces/consultas.interface';
import { ConsultasService } from '../../../services/consultas.service';

interface Seccion {
    titulo: string;
    campos: { etiqueta: string; valor: string }[];
}

// Consulta de identidad en RENIEC por DNI. Solo individual: no existe versión masiva.
@Component({
    selector: 'app-consulta-reniec',
    imports: [ReactiveFormsModule],
    templateUrl: './consulta-reniec.component.html',
    styleUrls: ['../consulta-dni/consulta-dni.component.css', './consulta-reniec.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaReniecComponent {
    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);

    readonly dni = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{8}$/)],
    });
    readonly formulario = new FormGroup({ dni: this.dni });

    readonly resultado = signal<ReniecResponse | null>(null);
    readonly cargando = signal(false);
    readonly error = signal('');

    readonly persona = computed(() => this.resultado()?.datos?.listaAni?.[0] ?? null);
    readonly foto = computed(() => this.imagen(this.resultado()?.datos?.foto));
    readonly firma = computed(() => this.imagen(this.resultado()?.datos?.firma));

    readonly nombreCompleto = computed(() => {
        const p = this.persona();
        return p
            ? [p.apePaterno, p.apeMaterno, p.preNombres].map(v => this.texto(v, '')).filter(Boolean).join(' ')
            : '';
    });

    readonly secciones = computed<Seccion[]>(() => {
        const p = this.persona();
        if (!p) return [];

        const t = (v?: string) => this.texto(v);
        return [
            {
                titulo: 'Identidad',
                campos: [
                    { etiqueta: 'DNI', valor: `${t(p.nuDni)}${p.digitoVerificacion ? '-' + p.digitoVerificacion : ''}` },
                    { etiqueta: 'Sexo', valor: t(p.sexo) },
                    { etiqueta: 'Estado civil', valor: t(p.estadoCivil) },
                    { etiqueta: 'Grado de instrucción', valor: t(p.gradoInstruccion) },
                    { etiqueta: 'Estatura', valor: t(p.estatura) },
                    { etiqueta: 'Donación de órganos', valor: t(p.donaOrganos) },
                ],
            },
            {
                titulo: 'Nacimiento y documento',
                campos: [
                    { etiqueta: 'Fecha de nacimiento', valor: t(p.feNacimiento) },
                    { etiqueta: 'Edad', valor: t(p.nuEdad) },
                    { etiqueta: 'Fecha de inscripción', valor: t(p.feInscripcion) },
                    { etiqueta: 'Fecha de emisión', valor: t(p.feEmision) },
                    { etiqueta: 'Fecha de caducidad', valor: t(p.feCaducidad) },
                    { etiqueta: 'Restricción', valor: t(p.deRestriccion) },
                ],
            },
            {
                titulo: 'Domicilio',
                campos: [
                    { etiqueta: 'Dirección', valor: t(p.desDireccion) },
                    { etiqueta: 'Distrito', valor: t(p.distDireccion) },
                    { etiqueta: 'Provincia', valor: t(p.provDireccion) },
                    { etiqueta: 'Departamento', valor: t(p.depaDireccion) },
                ],
            },
            {
                titulo: 'Lugar de nacimiento',
                campos: [
                    { etiqueta: 'Distrito', valor: t(p.distrito) },
                    { etiqueta: 'Provincia', valor: t(p.provincia) },
                    { etiqueta: 'Departamento', valor: t(p.departamento) },
                ],
            },
            {
                titulo: 'Padres',
                campos: [
                    { etiqueta: 'Padre', valor: t(p.nomPadre) },
                    { etiqueta: 'Madre', valor: t(p.nomMadre) },
                ],
            },
        ];
    });

    texto(valor: string | null | undefined, alternativo = 'No disponible'): string {
        const limpio = valor?.trim();
        return !limpio || limpio.toUpperCase() === 'NULL' ? alternativo : limpio;
    }

    // El proveedor entrega las imágenes en base64 (JPEG)
    private imagen(base64: string | undefined): string | null {
        return base64 ? `data:image/jpeg;base64,${base64}` : null;
    }

    limitarDni(event: Event): void {
        const input = event.target as HTMLInputElement;
        const limpio = input.value.replace(/\D/g, '').slice(0, 8);
        if (input.value !== limpio) {
            input.value = limpio;
            this.dni.setValue(limpio);
        }
    }

    buscar(): void {
        if (this.dni.invalid) {
            this.dni.markAsTouched();
            return;
        }
        if (this.cargando()) return;

        this.cargando.set(true);
        this.error.set('');
        this.resultado.set(null);

        this.servicio.consultarReniec(this.dni.value)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => this.resultado.set(r),
                error: e => this.error.set(mensajeError(e, 'No se pudo consultar RENIEC. Intenta nuevamente.')),
            });
    }

    limpiar(): void {
        this.formulario.reset({ dni: '' });
        this.resultado.set(null);
        this.error.set('');
    }
}
