import { RecordCarouselComponent, RecordSlideDirective } from '../../../../../shared/record-carousel.component';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { EmpresaIndividualService } from '../../../services/empresa-individual.service';
import { EmpresaResponse } from '../../../interfaces/empresa-response.interface';

@Component({
    selector: 'app-ruc',
    imports: [RecordCarouselComponent, RecordSlideDirective, ReactiveFormsModule],
    templateUrl: './ruc.component.html',
    styleUrls: ['../../../../personas/components/busqueda/consulta-dni/consulta-dni.component.css', './ruc.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RucComponent {
    private readonly servicio = inject(EmpresaIndividualService);
    private readonly destroyRef = inject(DestroyRef);
    readonly ruc = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^20[0-9]{9}$/)] });
    readonly formulario = new FormGroup({ ruc: this.ruc });
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly consultado = signal(false);
    readonly documentoConsultado = signal('');
    readonly resultado = signal<EmpresaResponse | null>(null);
    readonly activa = signal('');
    readonly razonSocial = computed(() => {
        const datos = this.resultado();
        return datos?.deudas?.find(r => r.razonSocial?.trim())?.razonSocial?.trim()
            || datos?.lineasCredito?.find(r => r.razonSocial?.trim())?.razonSocial?.trim()
            || datos?.calificaciones?.find(r => r.apePat?.trim())?.apePat?.trim() || 'No disponible';
    });
    readonly secciones = computed(() => {
        const datos = this.resultado();
        return [
            { id: 'deudas', titulo: 'Deudas', registros: datos?.deudas ?? [] },
            { id: 'lineasCredito', titulo: 'Líneas de crédito', registros: datos?.lineasCredito ?? [] },
            { id: 'calificaciones', titulo: 'Calificaciones', registros: datos?.calificaciones ?? [] },
            { id: 'moviles', titulo: 'Teléfonos', registros: datos?.moviles ?? [] },
            { id: 'sueldos', titulo: 'Información laboral', registros: datos?.sueldos ?? [] },
        ];
    });
    readonly tieneDatos = computed(() => this.secciones().some(s => s.registros.length > 0));

    campos(valor: unknown): { clave: string; valor: unknown }[] {
        if (valor === null || valor === undefined) return [];
        return typeof valor === 'object' && !Array.isArray(valor)
            ? Object.entries(valor).filter(([clave]) => !['apeMat', 'priNombre', 'segNombre'].includes(clave)).map(([clave, valor]) => ({ clave, valor }))
            : [{ clave: 'Valor', valor }];
    }
    titulo(clave: string): string {
        const etiquetas: Record<string, string> = { periodo: 'Período', codigoSbs: 'Código SBS', documento: 'Documento', razonSocial: 'Razón social', apePat: 'Razón social', dias: 'Días', calificacion: 'Calificación', lineaCreditoMonto: 'Monto de línea de crédito', lineaNoUtilizada: 'Línea no utilizada', lineaUtilizada: 'Línea utilizada', nor: 'Normal (NOR)', cpp: 'Problemas potenciales (CPP)', def: 'Deficiente (DEF)', dud: 'Dudoso (DUD)', per: 'Pérdida (PER)', reportan: 'Reportan' };
        return etiquetas[clave] ?? clave.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, letra => letra.toUpperCase());
    }
    texto(valor: unknown, clave = ''): string {
        if (valor === null || valor === undefined || valor === '') return 'No disponible';
        if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
        if (typeof valor === 'number') {
            if (['nor', 'cpp', 'def', 'dud', 'per'].includes(clave)) return `${valor.toFixed(2)} %`;
            if (['saldo', 'lineaCreditoMonto', 'lineaNoUtilizada', 'lineaUtilizada', 'montoSueldo', 'gratifBono', 'ingresoEstimadoAnual'].includes(clave)) return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
        }
        if (typeof valor === 'string') {
            const limpio = valor.trim();
            if (!limpio) return 'No disponible';
            if (clave === 'periodo' && /^[0-9]{6}$/.test(limpio)) return `${limpio.slice(4)}/${limpio.slice(0, 4)}`;
            return limpio;
        }
        return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    }
    soloNumeros(event: Event): void {
        const input = event.target as HTMLInputElement;
        input.value = input.value.replace(/[^0-9]/g, '').slice(0, 11);
        this.ruc.setValue(input.value);
    }
    buscar(): void {
        if (this.cargando()) return;
        this.formulario.markAllAsTouched();
        if (this.formulario.invalid) return;
        this.error.set('');
        this.resultado.set(null);
        this.consultado.set(true);
        this.documentoConsultado.set(this.ruc.value);
        this.cargando.set(true);
        this.servicio.buscarPorRuc(this.ruc.value)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: datos => { this.resultado.set(datos); this.activa.set(this.secciones().find(s => s.registros.length)?.id ?? this.secciones()[0]?.id ?? ''); },
                error: err => this.error.set(err.status === 400 && typeof err.error?.mensaje === 'string' ? err.error.mensaje : 'No se pudo consultar la empresa. Intenta nuevamente.'),
            });
    }
    limpiar(): void {
        if (this.cargando()) return;
        this.formulario.reset(); this.resultado.set(null); this.error.set(''); this.consultado.set(false); this.activa.set('');
    }
    navegar(event: KeyboardEvent, indice: number): void {
        const total = this.secciones().length;
        const destinos: Record<string, number> = { ArrowRight: (indice + 1) % total, ArrowLeft: (indice + total - 1) % total, Home: 0, End: total - 1 };
        if (!(event.key in destinos)) return;
        event.preventDefault();
        this.activa.set(this.secciones()[destinos[event.key]].id);
        (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[destinos[event.key]]?.focus();
    }
}
