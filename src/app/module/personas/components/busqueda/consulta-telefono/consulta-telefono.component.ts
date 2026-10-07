import { RecordCarouselComponent, RecordSlideDirective } from '../../../../../shared/record-carousel.component';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ConsultasService } from '../../../services/consultas.service';
import { BuscadorTelefonoResponse } from '../../../interfaces/consultas.interface';
import { PaginacionComponent } from '../../../../../shared/paginacion/paginacion.component';
import { IconoTablaComponent } from '../../../../../shared/iconos-tabla/iconos-tabla.component';

@Component({
    selector: 'app-consulta-telefono',
    imports: [ ReactiveFormsModule, DatePipe,
        LowerCasePipe,
        PaginacionComponent,IconoTablaComponent
    ],
    templateUrl: './consulta-telefono.component.html',
    styleUrls: ['../consulta-dni/consulta-dni.component.css', './consulta-telefono.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaTelefonoComponent {
    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);
    readonly telefono = new FormControl('', {
        nonNullable: true,
        validators: [
            Validators.required,
            Validators.pattern(/^9[0-9]{8}$/)
        ]
    });
    readonly formulario = new FormGroup({ telefono: this.telefono });
    readonly resultado = signal<BuscadorTelefonoResponse | null>(null);
    readonly cargando = signal(false);
    readonly error = signal('');
    texto(valor: string | null | undefined, alternativo = 'No disponible'): string {
        const limpio = valor?.trim();
        return !limpio || limpio.toUpperCase() === 'NULL' ? alternativo : limpio;
    }

    readonly elementosPorPagina = signal(4);
    readonly paginaActual = signal(1);

    readonly registrosPagina = computed(() => {
        const lista = this.resultado()?.registros ?? [];
        const inicio = (this.paginaActual() - 1) * this.elementosPorPagina();
        return lista.slice(inicio, inicio + this.elementosPorPagina());
    });

    cambiarPagina(nueva: number) {
        this.paginaActual.set(nueva);
    }

    buscar(): void {

        if (this.cargando()) return;

        this.formulario.markAllAsTouched();

        if (this.formulario.invalid) return;

        this.resultado.set(null);
        this.error.set('');
        this.cargando.set(true);

        this.servicio.consultarTelefono(this.telefono.value)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: datos => this.resultado.set(datos),
                error: () => this.error.set(
                    'No se pudo realizar la consulta. Intenta nuevamente.'
                )
            });
    }

    limpiar(): void {
        if (this.cargando()) return;
        this.formulario.reset();
        this.resultado.set(null);
        this.error.set('');
    }

    limitarTelefono(event: Event): void {
        const input = event.target as HTMLInputElement;

        const digitos = input.value.replace(/[^0-9]/g, '').slice(0, 9);
        input.value = digitos;
        this.telefono.setValue(digitos);
    }

    readonly titulares = computed(() => {
        const mapa = new Map<string, { documento: string; nombre: string }>();

        for (const r of this.resultado()?.registros ?? []) {
            const documento = (r.documento ?? '').trim();
            if (!documento) continue;

            const nombre = [r.apePat, r.apeMat, r.prenombres]
                .filter(Boolean)
                .join(' ')
                .trim();

            // Si ya existe pero sin nombre, completa con este registro
            if (!mapa.has(documento) || (!mapa.get(documento)!.nombre && nombre)) {
                mapa.set(documento, { documento, nombre });
            }
        }

        return [...mapa.values()];
    });
}
