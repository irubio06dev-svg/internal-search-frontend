import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ConsultasService } from '../../../services/consultas.service';
import { BuscadorResponse, ReniecResponse } from '../../../interfaces/consultas.interface';
import { imagenReniec, nombreReniec, seccionesReniec } from '../../../utils/reniec.utils';
import { mensajeError } from '../../../../../shared/utils/http-error.utils';
import { ActivatedRoute } from '@angular/router';

type Seccion = 'moviles' | 'sueldos' | 'deudas' | 'lineasCredito' | 'calificaciones';
type Pestana = Seccion | 'reniec';

@Component({
    selector: 'app-consulta-dni',
    imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
    templateUrl: './consulta-dni.component.html',
    styleUrls: ['./consulta-dni.component.css', './consulta-dni-reniec.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaDniComponent {
    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);
    readonly esEmpresa = inject(ActivatedRoute).snapshot.data['tipoDocumento'] === 'RUC';
    readonly tipoDocumento = this.esEmpresa ? 'RUC' : 'DNI';
    readonly longitudDocumento = this.esEmpresa ? 11 : 8;


    readonly dni = new FormControl('',
        {
            nonNullable: true, validators:
                [Validators.required, Validators.pattern(new RegExp(`^[0-9]{${this.longitudDocumento}}$`))]
        });
    readonly formulario = new FormGroup({ dni: this.dni });
    readonly resultado = signal<BuscadorResponse | null>(null);
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly documentoConsultado = signal('');
    readonly seccionActiva = signal<Pestana>('moviles');
    readonly secciones: { id: Seccion; titulo: string }[] = [
        { id: 'moviles', titulo: 'Teléfonos' },
        { id: 'sueldos', titulo: 'Información laboral' },
        { id: 'deudas', titulo: 'Deudas' },
        { id: 'lineasCredito', titulo: 'Líneas de crédito' },
        { id: 'calificaciones', titulo: 'Calificaciones' },
    ];

    // RENIEC solo aplica a personas (DNI); en la pestaña la consulta es bajo demanda y cuesta 1 token
    readonly pestanas: { id: Pestana; titulo: string }[] = this.esEmpresa
        ? this.secciones
        : [...this.secciones, { id: 'reniec', titulo: 'RENIEC' }];

    readonly reniec = signal<ReniecResponse | null>(null);
    readonly reniecCargando = signal(false);
    readonly reniecError = signal('');
    readonly reniecPersona = computed(() => this.reniec()?.datos?.listaAni?.[0] ?? null);
    readonly reniecNombre = computed(() => nombreReniec(this.reniecPersona()));
    readonly reniecFoto = computed(() => imagenReniec(this.reniec()?.datos?.foto));
    readonly reniecFirma = computed(() => imagenReniec(this.reniec()?.datos?.firma));
    readonly reniecSecciones = computed(() => seccionesReniec(this.reniecPersona()));

    conteo(id: Pestana, datos: BuscadorResponse): number | string {
        if (id === 'reniec') return this.reniecPersona() ? 1 : '—';
        return datos[id]?.length ?? 0;
    }

    consultarReniec(): void {
        if (this.reniecCargando() || this.esEmpresa) return;

        this.reniecCargando.set(true);
        this.reniecError.set('');

        this.servicio.consultarReniec(this.documentoConsultado())
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.reniecCargando.set(false)))
            .subscribe({
                next: r => this.reniec.set(r),
                error: e => this.reniecError.set(mensajeError(e, 'No se pudo consultar RENIEC. Intenta nuevamente.')),
            });
    }

    navegarTabs(event: KeyboardEvent, indice: number): void {
        let destino: number;
        switch (event.key) {
            case 'ArrowRight': destino = (indice + 1) % this.pestanas.length; break;
            case 'ArrowLeft': destino = (indice - 1 + this.pestanas.length) % this.pestanas.length; break;
            case 'Home': destino = 0; break;
            case 'End': destino = this.pestanas.length - 1; break;
            default: return;
        }
        event.preventDefault();
        this.seccionActiva.set(this.pestanas[destino].id);
        const boton = event.currentTarget as HTMLButtonElement;
        boton.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[destino]?.focus();
    }
    // Si la base interna no tiene el nombre, se usa el de RENIEC cuando ya se consultó
    readonly nombre = computed(() => {
        const interno = this.nombreInterno();
        return interno === 'No disponible' && this.reniecNombre() ? this.reniecNombre() : interno;
    });
    private readonly nombreInterno = computed(() => {
        const datos = this.resultado();
        if (this.esEmpresa) {
            return datos?.deudas?.find(d => d.razonSocial)?.razonSocial
                || datos?.lineasCredito?.find(d => d.razonSocial)?.razonSocial
                || 'No disponible';
        }
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
        this.reniec.set(null);
        this.reniecError.set('');
        this.documentoConsultado.set(this.dni.value);
        this.cargando.set(true);

        this.servicio.consultar({ tipoDocumento: this.tipoDocumento, documento: this.dni.value })
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: resultado => {
                    this.resultado.set(resultado);
                    // Sin datos internos, una persona se abre en RENIEC (las empresas siguen en Teléfonos)
                    this.seccionActiva.set(this.secciones.find(seccion => resultado[seccion.id]?.length)?.id
                        ?? (this.esEmpresa ? 'moviles' : 'reniec'));
                },
                error: () => this.error.set('No se pudo realizar la consulta. Intenta nuevamente.'),
            });
    }

    limpiar(): void {
        if (this.cargando()) return;
        this.formulario.reset();
        this.resultado.set(null);
        this.reniec.set(null);
        this.reniecError.set('');
        this.error.set('');
        this.documentoConsultado.set('');
    }

    soloNumeros(event: Event): void {
        const input = event.target as HTMLInputElement;

        const valorLimpio = input.value
            .replace(/\D/g, '')
            .slice(0, this.longitudDocumento);

        input.value = valorLimpio;
        this.dni.setValue(valorLimpio);
    }
}
