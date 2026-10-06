import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ConsultasService } from '../../../services/consultas.service';

import {
    BuscadorResponse,
    ReniecResponse
} from '../../../interfaces/consultas.interface';

import {
    imagenReniec,
    seccionesReniec
} from '../../../utils/reniec.utils';


type Seccion =
    | 'moviles'
    | 'sueldos'
    | 'deudas'
    | 'lineasCredito'
    | 'calificaciones';

type Pestana =
    | 'general'
    | Seccion
    | 'reniec';

interface Tab {
    id: Pestana;
    titulo: string;
}

// Mismos tipos que valida el backend
type TipoDocumento = 'DNI' | 'CE' | 'RUC' | 'PASAPORTE';

interface ConfigDocumento {
    etiqueta: string;
    patron: RegExp;
    soloNumeros: boolean;
    longitudMaxima: number;
    descripcion: string;
}

const DOCUMENTOS: Record<TipoDocumento, ConfigDocumento> = {
    DNI: {
        etiqueta: 'DNI',
        patron: /^[0-9]{8}$/,
        soloNumeros: true,
        longitudMaxima: 8,
        descripcion: '8 dígitos',
    },
    CE: {
        etiqueta: 'CE',
        patron: /^[0-9]{9}$/,
        soloNumeros: true,
        longitudMaxima: 9,
        descripcion: '9 dígitos',
    },
    RUC: {
        etiqueta: 'RUC',
        patron: /^[0-9]{11}$/,
        soloNumeros: true,
        longitudMaxima: 11,
        descripcion: '11 dígitos',
    },
    PASAPORTE: {
        etiqueta: 'Pasaporte',
        patron: /^[A-Za-z0-9]{6,12}$/,
        soloNumeros: false,
        longitudMaxima: 12,
        descripcion: 'entre 6 y 12 caracteres alfanuméricos',
    },
};


@Component({
    selector: 'app-consulta-dni',
    imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
    templateUrl: './consulta-dni.component.html',

    styleUrls: [
        './consulta-dni.component.css',
        './consulta-dni-reniec.css'
    ],

    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaDniComponent {

    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly tipoRuta = inject(ActivatedRoute).snapshot.data['tipoDocumento'];

    // =========================================================
    // TIPO DE DOCUMENTO
    // =========================================================

    readonly tiposDocumento = (Object.keys(DOCUMENTOS) as TipoDocumento[])
        .map(id => ({ id, etiqueta: DOCUMENTOS[id].etiqueta }));

    readonly tipoDocumento = signal<TipoDocumento>(
        this.tipoRuta in DOCUMENTOS ? this.tipoRuta : 'DNI'
    );
    readonly config = computed(() => DOCUMENTOS[this.tipoDocumento()]);
    readonly esEmpresa = computed(() => this.tipoDocumento() === 'RUC');
    readonly esDni = computed(() => this.tipoDocumento() === 'DNI');

    // =========================================================
    // FORMULARIO
    // =========================================================

    private readonly validarFormato: ValidatorFn = control =>
        this.config().patron.test(String(control.value ?? '')) ? null : { formato: true };

    readonly dni = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, this.validarFormato],
    });
    readonly formulario = new FormGroup({ dni: this.dni });

    // =========================================================
    // ESTADO
    // =========================================================

    readonly resultado = signal<BuscadorResponse | null>(null);
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly documentoConsultado = signal('');
    readonly seccionActiva = signal<Pestana>('general');

    // RENIEC
    readonly reniec = signal<ReniecResponse | null>(null);
    readonly reniecCargando = signal(false);
    readonly reniecError = signal('');

    // =========================================================
    // PESTAÑAS
    // =========================================================

    readonly secciones: { id: Seccion; titulo: string }[] = [
        { id: 'moviles', titulo: 'Teléfonos' },
        { id: 'sueldos', titulo: 'Información laboral' },
        { id: 'deudas', titulo: 'Deudas' },
        { id: 'lineasCredito', titulo: 'Líneas de crédito' },
        { id: 'calificaciones', titulo: 'Calificaciones' },
    ];

    /** General + secciones + RENIEC (RENIEC solo para DNI). */
    readonly pestanas = computed<Tab[]>(() => [
        { id: 'general', titulo: 'General' },
        ...this.secciones,
        ...(this.esDni() ? [{ id: 'reniec' as Pestana, titulo: 'RENIEC' }] : []),
    ]);

    navegarTabs(event: KeyboardEvent, indice: number): void {
        const tabs = this.pestanas();
        let destino: number;
        switch (event.key) {
            case 'ArrowRight': destino = (indice + 1) % tabs.length; break;
            case 'ArrowLeft': destino = (indice - 1 + tabs.length) % tabs.length; break;
            case 'Home': destino = 0; break;
            case 'End': destino = tabs.length - 1; break;
            default: return;
        }
        event.preventDefault();
        this.seccionActiva.set(tabs[destino].id);
        const boton = event.currentTarget as HTMLButtonElement;
        boton.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[destino]?.focus();
    }

    /** Número que se muestra en la insignia de cada pestaña. */
    conteo(id: Pestana, datos: BuscadorResponse): number | string {
        if (id === 'general') return '';
        if (id === 'reniec') return this.reniecPersona() ? 1 : '—';
        return datos[id]?.length ?? 0;
    }

    // =========================================================
    // DATOS DERIVADOS
    // =========================================================

    readonly nombre = computed(() => {
        const datos = this.resultado();
        if (this.esEmpresa()) {
            return datos?.deudas?.find(d => d.razonSocial)?.razonSocial
                || datos?.lineasCredito?.find(d => d.razonSocial)?.razonSocial
                || 'No disponible';
        }
        const persona = datos?.calificaciones?.find(p => p.apePat || p.apeMat || p.priNombre || p.segNombre);
        if (persona) return [persona.apePat, persona.apeMat, persona.priNombre, persona.segNombre].filter(Boolean).join(' ');
        const movil = datos?.moviles?.find(p => p.apePat || p.apeMat || p.prenombres);
        return movil
            ? [movil.apePat, movil.apeMat, movil.prenombres].filter(Boolean).join(' ')
            : datos?.sueldos?.find(p => p.apeNom)?.apeNom || 'No disponible';
    });

    readonly tieneDatos = computed(() => {
        const r = this.resultado();
        return !!r && [r.deudas, r.lineasCredito, r.calificaciones, r.sueldos, r.moviles].some(lista => lista?.length);
    });

    // RENIEC
    readonly reniecPersona = computed(() => this.reniec()?.datos?.listaAni?.[0] ?? null);
    readonly reniecFoto = computed(() => imagenReniec(this.reniec()?.datos?.foto));
    readonly reniecFirma = computed(() => imagenReniec(this.reniec()?.datos?.firma));
    readonly reniecSecciones = computed(() => seccionesReniec(this.reniecPersona()));

    // =========================================================
    // ACCIONES
    // =========================================================

    cambiarTipo(event: Event): void {
        if (this.cargando()) return;
        const tipo = (event.target as HTMLSelectElement).value as TipoDocumento;
        if (!(tipo in DOCUMENTOS)) return;
        this.tipoDocumento.set(tipo);
        this.limpiar();
    }

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

        this.servicio.consultar({ tipoDocumento: this.tipoDocumento(), documento: this.dni.value })
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: resultado => {
                    this.resultado.set(resultado);
                    this.seccionActiva.set('general');
                },
                error: () => this.error.set('No se pudo realizar la consulta. Intenta nuevamente.'),
            });
    }

    consultarReniec(): void {
        const documento = this.documentoConsultado();
        if (!this.esDni() || !documento || this.reniecCargando()) return;

        this.reniecError.set('');
        this.reniecCargando.set(true);

        this.servicio.consultarReniec(documento)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.reniecCargando.set(false)))
            .subscribe({
                next: respuesta => this.reniec.set(respuesta),
                error: () => this.reniecError.set('No se pudo consultar RENIEC. Intenta nuevamente.'),
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
        this.seccionActiva.set('general');
    }

    /** Filtra lo que se escribe según el tipo de documento seleccionado. */
    filtrarEntrada(event: Event): void {
        const input = event.target as HTMLInputElement;
        const { soloNumeros, longitudMaxima } = this.config();
        const valor = input.value
            .replace(soloNumeros ? /\D/g : /[^A-Za-z0-9]/g, '')
            .slice(0, longitudMaxima);
        input.value = valor;
        this.dni.setValue(valor);
    }
}