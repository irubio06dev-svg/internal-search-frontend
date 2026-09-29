import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ConsultasService } from '../../../services/consultas.service';
import { BuscadorResponse } from '../../../interfaces/consultas.interface';

type Seccion = 'moviles' | 'sueldos' | 'deudas' | 'lineasCredito' | 'calificaciones';

@Component({
    selector: 'app-consulta-dni',
    imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
    templateUrl: './consulta-dni.component.html',
    styleUrl: './consulta-dni.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaDniComponent {
    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);


    readonly dni = new FormControl('', 
            { nonNullable: true, validators: 
                [Validators.required, Validators.pattern(/^\d{8}$/)] 
    });
    readonly formulario = new FormGroup({ dni: this.dni });
    readonly resultado = signal<BuscadorResponse | null>(null);
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly documentoConsultado = signal('');
    readonly seccionActiva = signal<Seccion>('moviles');
    readonly secciones: { id: Seccion; titulo: string }[] = [
        { id: 'moviles', titulo: 'Teléfonos' },
        { id: 'sueldos', titulo: 'Información laboral' },
        { id: 'deudas', titulo: 'Deudas' },
        { id: 'lineasCredito', titulo: 'Líneas de crédito' },
        { id: 'calificaciones', titulo: 'Calificaciones' },
    ];

    navegarTabs(event: KeyboardEvent, indice: number): void {
        let destino: number;
        switch (event.key) {
            case 'ArrowRight': destino = (indice + 1) % this.secciones.length; break;
            case 'ArrowLeft': destino = (indice - 1 + this.secciones.length) % this.secciones.length; break;
            case 'Home': destino = 0; break;
            case 'End': destino = this.secciones.length - 1; break;
            default: return;
        }
        event.preventDefault();
        this.seccionActiva.set(this.secciones[destino].id);
        const boton = event.currentTarget as HTMLButtonElement;
        boton.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[destino]?.focus();
    }
    readonly nombre = computed(() => {
        const datos = this.resultado();
        const persona = datos?.calificaciones?.find(p => p.apePat || p.apeMat || p.priNombre || p.segNombre);
        if (persona) return [persona.apePat, persona.apeMat, persona.priNombre, persona.segNombre].filter(Boolean).join(' ');
        const movil = datos?.moviles?.find(p => p.apePat || p.apeMat || p.prenombres);
        return movil ? [movil.apePat, movil.apeMat, movil.prenombres].filter(Boolean).join(' ') : datos?.sueldos?.find(p => p.apeNom)?.apeNom || 'No disponible';
    });
    readonly tieneDatos = computed(() => {
        const r = this.resultado();
        return !!r && [r.deudas, r.lineasCredito, r.calificaciones, r.sueldos, r.moviles].some(lista => lista?.length);
    });

    buscar(): void {
        if (this.cargando()) return;
        this.dni.setValue(this.dni.value.trim());
        this.formulario.markAllAsTouched();
        if (this.formulario.invalid) return;
        this.error.set('');
        this.resultado.set(null);
        this.documentoConsultado.set(this.dni.value);
        this.cargando.set(true);

        this.servicio.consultar({ tipoDocumento: 'DNI', documento: this.dni.value })
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: resultado => {
                    this.resultado.set(resultado);
                    this.seccionActiva.set(this.secciones.find(seccion => resultado[seccion.id]?.length)?.id ?? 'moviles');
                },
                error: () => this.error.set('No se pudo realizar la consulta. Intenta nuevamente.'),
            });
    }

    limpiar(): void {
        if (this.cargando()) return;
        this.formulario.reset();
        this.resultado.set(null);
        this.error.set('');
        this.documentoConsultado.set('');
    }
}
