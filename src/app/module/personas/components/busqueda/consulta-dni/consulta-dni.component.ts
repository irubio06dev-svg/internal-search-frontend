import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
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
import { PaginacionComponent } from '../../../../../shared/paginacion/paginacion.component';
import { IconoTablaComponent } from '../../../../../shared/iconos-tabla/iconos-tabla.component';


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
type SeccionPaginada = 'moviles' | 'sueldos' | 'deudas' | 'lineasCredito' | 'calificaciones';

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
    imports: [ReactiveFormsModule, IconoTablaComponent, DatePipe, DecimalPipe, LowerCasePipe, PaginacionComponent],
    templateUrl: './consulta-dni.component.html',

    styleUrls: [
        './consulta-dni.component.css',
        './consulta-dni-reniec.css'
    ],

    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaDniComponent {

    // paginaActual = signal(1);
    // elementosPorPagina = signal(4);



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

    cambiarTipo(tipo: TipoDocumento): void {
        if (this.cargando()) return;
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
        this.telefonoSeleccionado.set('');
        this.resetPaginas();
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
        this.telefonoSeleccionado.set('');
        this.resetPaginas();
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

    //PAGINACION
    readonly filasResumen = 4;

    private readonly PAGINAS_INICIALES: Record<SeccionPaginada, number> = {
        moviles: 1, sueldos: 1, deudas: 1, lineasCredito: 1, calificaciones: 1,
    };

    readonly elementosPorPagina = signal(4);
    private readonly paginas = signal<Record<SeccionPaginada, number>>({ ...this.PAGINAS_INICIALES });

    pagina(id: SeccionPaginada) { return this.paginas()[id]; }

    cambiarPagina(id: SeccionPaginada, nueva: number) {
        this.paginas.update(p => ({ ...p, [id]: nueva }));
    }

    resetPaginas() { this.paginas.set({ ...this.PAGINAS_INICIALES }); }

    private cortar<T>(lista: T[] | undefined, id: SeccionPaginada): T[] {
        const inicio = (this.pagina(id) - 1) * this.elementosPorPagina();
        return (lista ?? []).slice(inicio, inicio + this.elementosPorPagina());
    }

    readonly telefonoSeleccionado = signal('');
    readonly filtroTelefonoAbierto = signal(false);
    readonly selectorDocumentoAbierto = signal(false);
    private readonly eventosSelectores = new Map<HTMLElement, AbortController>();

    constructor() {
        this.destroyRef.onDestroy(() => this.eventosSelectores.forEach(eventos => eventos.abort()));
    }

    actualizarEstadoFiltroTelefono(lista: HTMLElement, documento = false): void {
        const abierto = lista.matches(':popover-open');
        (documento ? this.selectorDocumentoAbierto : this.filtroTelefonoAbierto).set(abierto);
        if (!abierto) {
            this.eventosSelectores.get(lista)?.abort();
            this.eventosSelectores.delete(lista);
        }
    }

    abrirFiltroTelefono(lista: HTMLElement, boton: HTMLButtonElement): void {
        if (lista.matches(':popover-open')) {
            lista.hidePopover();
            return;
        }
        this.posicionarFiltroTelefono(lista, boton);
        lista.showPopover();
        lista.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
        this.eventosSelectores.get(lista)?.abort();
        const eventos = new AbortController();
        this.eventosSelectores.set(lista, eventos);
        const { signal } = eventos;
        window.addEventListener('scroll', event => {
            if (event.target instanceof Node && lista.contains(event.target)) return;
            if (lista.matches(':popover-open')) this.posicionarFiltroTelefono(lista, boton);
        }, { capture: true, passive: true, signal });
        window.addEventListener('resize', () => {
            if (lista.matches(':popover-open')) this.posicionarFiltroTelefono(lista, boton);
        }, { passive: true, signal });
    }

    private posicionarFiltroTelefono(lista: HTMLElement, boton: HTMLButtonElement): void {
        const rect = boton.getBoundingClientRect();
        const ancho = Math.min(Math.max(rect.width, 240), window.innerWidth - 24);
        const debajo = window.innerHeight - rect.bottom - 20;
        const arriba = rect.top - 20;
        const abrirArriba = debajo < 200 && arriba > debajo;
        Object.assign(lista.style, {
            width: `${ancho}px`,
            left: `${Math.max(12, Math.min(rect.left, window.innerWidth - ancho - 12))}px`,
            top: abrirArriba ? 'auto' : `${rect.bottom + 6}px`,
            bottom: abrirArriba ? `${window.innerHeight - rect.top + 6}px` : 'auto',
            maxHeight: `${Math.max(0, Math.min(320, abrirArriba ? arriba : debajo))}px`,
        });
    }

    navegarTelefonos(event: KeyboardEvent, lista: HTMLElement): void {
        const botones = Array.from(lista.querySelectorAll<HTMLButtonElement>('button'));
        const actual = botones.indexOf(event.target as HTMLButtonElement);
        let siguiente: number;
        switch (event.key) {
            case 'ArrowDown': siguiente = (actual + 1) % botones.length; break;
            case 'ArrowUp': siguiente = (actual - 1 + botones.length) % botones.length; break;
            case 'Home': siguiente = 0; break;
            case 'End': siguiente = botones.length - 1; break;
            default: return;
        }
        event.preventDefault();
        botones[siguiente]?.focus();
    }
    readonly telefonosDisponibles = computed(() => [...new Set(
        (this.resultado()?.moviles ?? [])
            .map(movil => movil.telefono?.trim() ?? '')
            .filter(telefono => telefono !== '')
    )].sort());
    readonly movilesFiltrados = computed(() => {
        const moviles = this.resultado()?.moviles ?? [];
        const telefono = this.telefonoSeleccionado();
        return telefono ? moviles.filter(movil => movil.telefono?.trim() === telefono) : moviles;
    });

    filtrarTelefono(telefono: string): void {
        this.telefonoSeleccionado.set(telefono);
        this.cambiarPagina('moviles', 1);
    }

    readonly movilesPagina = computed(() => this.cortar(this.movilesFiltrados(), 'moviles'));
    readonly sueldosPagina = computed(() => this.cortar(this.resultado()?.sueldos, 'sueldos'));
    readonly deudasPagina = computed(() => this.cortar(this.resultado()?.deudas, 'deudas'));
    readonly lineasCreditoPagina = computed(() => this.cortar(this.resultado()?.lineasCredito, 'lineasCredito'));
    readonly calificacionesPagina = computed(() => this.cortar(this.resultado()?.calificaciones, 'calificaciones'));


}
