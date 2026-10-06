import { RecordCarouselComponent, RecordSlideDirective } from '../../../../../shared/record-carousel.component';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { EmpresaIndividualService } from '../../../services/empresa-individual.service';
import { EmpresaResponse } from '../../../interfaces/empresa-response.interface';

@Component({
    selector: 'app-razon-social',
    imports: [RecordCarouselComponent, RecordSlideDirective, ReactiveFormsModule],
    templateUrl: './razon-social.component.html',
    styleUrls: ['../../../../personas/components/busqueda/consulta-dni/consulta-dni.component.css', './razon-social.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RazonSocialComponent {
    @ViewChild('selectorEmpresas') private selector?: ElementRef<HTMLDetailsElement>;
    cerrarSelector(): void {
        const selector = this.selector?.nativeElement;
        if (!selector?.open) return;
        selector.open = false;
        selector.querySelector('summary')?.focus();
    }
    @HostListener('document:click', ['$event'])
    cerrarSelectorFuera(event: MouseEvent): void {
        const selector = this.selector?.nativeElement;
        if (selector && !selector.contains(event.target as Node)) selector.open = false;
    }
    
    private readonly servicio = inject(EmpresaIndividualService);
    private readonly destroyRef = inject(DestroyRef);
    readonly nombreBusqueda = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });
    readonly formulario = new FormGroup({ razonSocial: this.nombreBusqueda });
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly consultado = signal(false);
    readonly documentoConsultado = signal('');
    readonly respuesta = signal<EmpresaResponse | null>(null);
    readonly empresaSeleccionada = signal('');
    readonly empresas = computed(() => {
        const datos = this.respuesta();
        const empresas = new Map<string, string>();
        for (const registro of [...(datos?.deudas ?? []), ...(datos?.lineasCredito ?? []), ...(datos?.calificaciones ?? []), ...(datos?.moviles ?? []), ...(datos?.sueldos ?? [])]) {
            const campos = registro as unknown as Record<string, unknown>;
            const documento = this.documentoDe(campos);
            const nombre = [campos['razonSocial'], campos['empresa'], campos['apePat']].find(v => typeof v === 'string' && v.trim()) as string | undefined;
            if (!empresas.has(documento) || empresas.get(documento) === 'Razón social no disponible') empresas.set(documento, nombre?.trim() || 'Razón social no disponible');
        }
        return Array.from(empresas, ([documento, nombre]) => ({ documento, nombre }));
    });
    readonly resultado = computed<EmpresaResponse | null>(() => {
        const datos = this.respuesta();
        if (!datos) return null;
        const coincide = (registro: unknown) => this.documentoDe(registro as Record<string, unknown>) === this.empresaSeleccionada();
        return {
            deudas: (datos.deudas ?? []).filter(coincide),
            lineasCredito: (datos.lineasCredito ?? []).filter(coincide),
            calificaciones: (datos.calificaciones ?? []).filter(coincide),
            moviles: (datos.moviles ?? []).filter(coincide),
            sueldos: (datos.sueldos ?? []).filter(coincide),
        };
    });
    private documentoDe(registro: Record<string, unknown>): string {
        return String(registro['documento'] ?? registro['ruc'] ?? '').trim();
    }
    seleccionarEmpresa(documento: string): void {
        this.empresaSeleccionada.set(documento);
        this.documentoConsultado.set(documento || 'Sin documento informado');
        this.activa.set(this.secciones().find(s => s.registros.length)?.id ?? 'deudas');
    }
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
            // { id: 'sueldos', titulo: 'Información laboral', registros: datos?.sueldos ?? [] },
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

    buscar(): void {
        if (this.cargando()) return;
        this.nombreBusqueda.setValue(this.nombreBusqueda.value.trim());
        this.formulario.markAllAsTouched();
        if (this.formulario.invalid) return;
        this.error.set('');
        this.respuesta.set(null);
        this.consultado.set(true);
        this.documentoConsultado.set(this.nombreBusqueda.value);
        this.cargando.set(true);
        this.servicio.buscarPorRazonSocial(this.nombreBusqueda.value)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: datos => { this.respuesta.set(datos); this.seleccionarEmpresa(this.empresas()[0]?.documento ?? ''); },
                error: err => this.error.set(err.status === 400 && typeof err.error?.mensaje === 'string' ? err.error.mensaje : 'No se pudo consultar la empresa. Intenta nuevamente.'),
            });
    }


    limpiar(): void {
        if (this.cargando()) return;
        this.formulario.reset(); this.respuesta.set(null); this.empresaSeleccionada.set(''); this.error.set(''); this.consultado.set(false); this.activa.set('');
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
