import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, TimeoutError, finalize } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { HistorialDescarga } from '../../interfaces/historial.interface';
import { EstadoCarga, TipoMensaje } from '../../interfaces/consultas-masivas';
import { ConsultasMasivasService } from '../../services/consultas-masiva.service';
import { ValidacionService } from '../../services/validacion.service';


import { PageHeaderComponent } from '../../components/masivas/page-header/page-header.component';
import { CardHeadingComponent } from '../../components/masivas/card-heading/card-heading.component';
import { ModoEntrada, SelectorModoComponent } from '../../components/masivas/selector-modo/selector-modo.component';
import { PegarDocumentosComponent } from '../../components/masivas/pegar-documentos/pegar-documentos.component';
import { ProgresoCargaComponent } from '../../components/masivas/progreso-carga/progreso-carga.component';
import { AlertaComponent } from '../../components/masivas/alerta/alerta.component';
import { OpcionSeccion, SelectorSeccionesComponent } from '../../components/masivas/selector-secciones/selector-secciones.component';
import { FileDropzoneComponent } from '../../components/masivas/file-dropzone/file-dropzone.component';
import { ArchivoSeleccionadoComponent } from '../../components/masivas/archivo-seleccionado/archivo-seleccionado.component';
import { HistorialDescargasComponent } from '../../components/masivas/historial-descargas/historial-descargas.component';
import { analizarDocumentos, crearArchivoDocumentos, formatearNumero, LIMITE_DOCUMENTOS, TIPOS_DOCUMENTO } from '../../../../shared/utils/analizar-documentos';

interface ArchivoGenerado { nombre: string; blob: Blob; }

@Component({
    selector: 'app-consultas-masivas',
    imports: [
        PageHeaderComponent, CardHeadingComponent, SelectorModoComponent, PegarDocumentosComponent,
        FileDropzoneComponent, ArchivoSeleccionadoComponent, ProgresoCargaComponent, AlertaComponent,
        SelectorSeccionesComponent, HistorialDescargasComponent,
    ],
    templateUrl: './consultas-masivas.component.html',
    styleUrl: './consultas-masivas.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultasMasivasComponent implements OnInit {
    private readonly service = inject(ConsultasMasivasService);
    private readonly authService = inject(AuthService);
    private readonly validacion = inject(ValidacionService);
    private readonly destroyRef = inject(DestroyRef);
    private subscripcionActual?: Subscription;

    // Los ids deben coincidir con SeccionesMasivo del backend
    readonly opciones: OpcionSeccion[] = [
        { id: 'moviles', nombre: 'Teléfonos', detalle: 'Números, operadoras y planes.' },
        { id: 'sueldos', nombre: 'Información laboral', detalle: 'Empresas e ingresos reportados.' },
        { id: 'deuda', nombre: 'Deudas', detalle: 'Entidades, saldos y períodos.' },
        { id: 'lineas-credito', nombre: 'Líneas de crédito', detalle: 'Montos utilizados y disponibles.' },
        { id: 'calificacion', nombre: 'Calificaciones', detalle: 'Clasificación crediticia reportada.' },
    ];

    readonly limiteDocumentos = LIMITE_DOCUMENTOS;
    readonly tiposAceptados = TIPOS_DOCUMENTO.map(t => t.nombre).join(', ');

    // ---------- Estado ----------
    readonly modoEntrada = signal<ModoEntrada>('pegar');
    readonly textoPegado = signal<string>('');
    readonly seccionesSeleccionadas = signal<string[]>(this.opciones.map(o => o.id));
    readonly archivoSeleccionado = signal<File | null>(null);
    readonly cantidadLineasDetectadas = signal<number | null>(null);
    readonly estado = signal<EstadoCarga>({ cargando: false, progreso: 0, mensaje: '' });
    readonly tipoMensaje = signal<TipoMensaje>(null);
    readonly mensaje = signal<string>('');
    readonly mostrarReintentar = signal<boolean>(false);
    readonly progresoDisponible = signal<boolean>(false);
    readonly historialCargas = signal<HistorialDescarga[]>([]);
    readonly cargandoHistorial = signal<boolean>(false);
    readonly errorHistorial = signal<string>('');
    readonly enviandoHistorial = signal<boolean>(false);
    readonly descargandoId = signal<number | null>(null);
    private readonly totalDocumentosArchivo = signal<number>(0);

    // ---------- Derivados ----------
    readonly analisisPegado = computed(() => analizarDocumentos(this.textoPegado()));

    readonly excedeLimite = computed(() =>
        this.modoEntrada() === 'pegar' && this.analisisPegado().validos.length > LIMITE_DOCUMENTOS);

    readonly totalDocumentos = computed(() =>
        this.modoEntrada() === 'pegar' ? this.analisisPegado().validos.length : this.totalDocumentosArchivo());

    readonly mostrarAdvertenciaVolumen = computed(() =>
        this.modoEntrada() === 'pegar'
            ? this.analisisPegado().validos.length > 2000 && !this.excedeLimite()
            : (this.cantidadLineasDetectadas() ?? 0) > 2000);

    readonly puedeProcesar = computed(() => {
        if (this.estado().cargando || this.enviandoHistorial() || !this.seccionesSeleccionadas().length) return false;

        return this.modoEntrada() === 'pegar'
            ? this.analisisPegado().validos.length > 0 && !this.excedeLimite()
            : !!this.archivoSeleccionado() && this.cantidadLineasDetectadas() !== null && this.totalDocumentosArchivo() > 0;
    });

    readonly textoBotonProcesar = computed(() => {
        if (this.enviandoHistorial()) return 'Enviando historial...';
        if (this.estado().cargando) return 'Procesando...';
        const total = this.totalDocumentos();
        return total > 0 && !this.excedeLimite()
            ? `Procesar ${formatearNumero(total)} ${total === 1 ? 'documento' : 'documentos'} y descargar Excel`
            : 'Procesar y descargar Excel';
    });

    readonly textoAyuda = computed(() => {
        if (!this.seccionesSeleccionadas().length) return 'Selecciona al menos una sección para continuar.';
        if (this.modoEntrada() === 'pegar') {
            if (this.excedeLimite()) return `El máximo es ${formatearNumero(LIMITE_DOCUMENTOS)} documentos por consulta. Divide la lista en varias consultas.`;
            if (!this.analisisPegado().validos.length) return 'Pega al menos un documento válido para continuar.';
        } else if (!this.archivoSeleccionado()) {
            return 'Selecciona un archivo para continuar.';
        }
        return '';
    });

    ngOnInit(): void { this.cargarHistorial(); }

    // ---------- Modo de entrada ----------
    cambiarModo(modo: ModoEntrada): void {
        if (this.estado().cargando || this.modoEntrada() === modo) return;
        this.modoEntrada.set(modo);
        this.limpiarMensaje();
    }

    // ---------- Texto pegado ----------
    onTextoPegado(texto: string): void {
        this.textoPegado.set(texto);
        if (this.tipoMensaje() === 'error') this.limpiarMensaje();
    }

    quitarInvalidos(): void {
        this.textoPegado.set(this.analisisPegado().validos.join('\n'));
    }

    limpiarTexto(): void {
        if (this.estado().cargando) return;
        this.textoPegado.set('');
        this.limpiarMensaje();
    }

    // ---------- Secciones ----------
    seleccionarTodas(marcado: boolean): void {
        if (this.estado().cargando) return;
        this.seccionesSeleccionadas.set(marcado ? this.opciones.map(o => o.id) : []);
    }

    seleccionarSeccion({ id, marcado }: { id: string; marcado: boolean }): void {
        if (this.estado().cargando) return;
        const sinId = this.seccionesSeleccionadas().filter(s => s !== id);
        this.seccionesSeleccionadas.set(marcado ? [...sinId, id] : sinId);
    }

    // ---------- Archivo ----------
    onArchivos(files: File[]): void {
        if (this.estado().cargando || !files.length) return;
        if (files.length !== 1) return this.mostrarMensaje('Selecciona un solo archivo.', 'error');
        void this.seleccionarArchivo(files[0]);
    }

    private async seleccionarArchivo(archivo: File): Promise<void> {
        if (this.estado().cargando || this.enviandoHistorial()) return;

        this.limpiarMensaje();

        const { valido, mensajeError } = this.validacion.validar(archivo);
        if (!valido) return this.mostrarMensaje(mensajeError ?? 'Archivo no permitido.', 'error');

        this.archivoSeleccionado.set(archivo);
        this.cantidadLineasDetectadas.set(null);

        try {
            const texto = await archivo.text();
            if (this.archivoSeleccionado() !== archivo) return;

            const total = analizarDocumentos(texto).validos.length;
            this.totalDocumentosArchivo.set(total);
            this.cantidadLineasDetectadas.set(texto.split(/\r\n|\n|\r/).filter(l => l.trim()).length);

            if (total === 0) {
                this.resetArchivo();
                return this.mostrarMensaje('El archivo no contiene documentos válidos.', 'error');
            }

            if (total > LIMITE_DOCUMENTOS) {
                this.resetArchivo();
                this.mostrarMensaje(
                    `El archivo tiene ${formatearNumero(total)} documentos. El máximo es ${formatearNumero(LIMITE_DOCUMENTOS)} por consulta.`,
                    'error');
            }
        } catch {
            if (this.archivoSeleccionado() !== archivo) return;
            this.resetArchivo();
            this.mostrarMensaje('No se pudo leer el archivo. Selecciona otro.', 'error');
        }
    }

    quitarArchivo(): void {
        if (this.estado().cargando) return;
        this.resetArchivo();
        this.limpiarMensaje();
    }

    private resetArchivo(): void {
        this.archivoSeleccionado.set(null);
        this.cantidadLineasDetectadas.set(null);
        this.totalDocumentosArchivo.set(0);
    }

    descargarPlantilla(formato: 'txt' | 'csv'): void {
        const contenido = '00000000\r\n20000000001\r\n000000001\r\n';
        const tipo = formato === 'txt' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8';
        this.service.descargarBlob(new Blob([contenido], { type: tipo }), `Plantilla_Documentos.${formato}`);
    }

    // ---------- Procesar ----------
    procesar(): void {
        if (!this.puedeProcesar()) return;

        const archivo = this.modoEntrada() === 'pegar'
            ? crearArchivoDocumentos(this.analisisPegado().validos)
            : this.archivoSeleccionado();
        if (!archivo) return;

        const secciones = [...this.seccionesSeleccionadas()];
        const totalDocumentos = this.totalDocumentos();

        this.limpiarMensaje();
        this.progresoDisponible.set(false);
        this.estado.set({ cargando: true, progreso: 0, mensaje: 'Enviando documentos y preparando Excel...' });

        this.subscripcionActual = this.service.exportarMasivo(archivo, secciones)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.estado.set({ cargando: false, progreso: 0, mensaje: '' })),
            )
            .subscribe({
                next: evento => {
                    if (evento.tipo === 'progreso' && evento.porcentaje !== undefined) {
                        const p = evento.porcentaje;
                        this.progresoDisponible.set(p > 0 && p < 100);
                        this.estado.set({
                            cargando: true,
                            progreso: p,
                            mensaje: p >= 100 ? 'Documentos enviados. Preparando Excel...' : `Subiendo... ${p}%`,
                        });
                    } else if (evento.tipo === 'completado') {
                        this.alCompletar(evento.archivo, evento.nombreArchivo, secciones, totalDocumentos);
                    }
                },
                error: err => void this.alError(err),
            });
    }

    private alCompletar(blob: Blob | undefined, nombre: string | undefined, secciones: string[], totalDocumentos: number): void {
        if (!blob?.size) return this.mostrarMensaje('El servidor no devolvió un archivo Excel.', 'error');

        const item: ArchivoGenerado = { nombre: nombre ?? 'Resultado_Masivo.xlsx', blob };
        this.service.descargarBlob(item.blob, item.nombre);
        this.resetArchivo();
        this.textoPegado.set('');
        this.mostrarMensaje('Excel generado. Se inició la descarga.', 'success');
        this.guardarHistorial(item, secciones, totalDocumentos);
    }

    private async alError(err: any): Promise<void> {
        const esTimeout = err instanceof TimeoutError;
        const mensaje = esTimeout
            ? 'El servidor no terminó la consulta en cinco minutos. Puedes reintentar o probar con menos documentos.'
            : err.error instanceof Blob
                ? await this.service.leerMensajeError(err.error)
                : 'No se pudo completar la solicitud.';

        if (this.destroyRef.destroyed) return;
        this.mostrarReintentar.set(esTimeout || [0, 408, 429].includes(err.status) || err.status >= 500);
        this.mostrarMensaje(mensaje, 'error');
    }

    cancelarCarga(): void {
        this.subscripcionActual?.unsubscribe(); // finalize resetea el estado
        this.limpiarMensaje();
    }

    reintentar(): void {
        if (this.mostrarReintentar()) this.procesar();
    }

    // ---------- Historial ----------
    cargarHistorial(): void {
        const usuario = this.authService.user();
        if (!usuario) return;
        this.cargandoHistorial.set(true);
        this.errorHistorial.set('');
        this.service.obtenerHistorial(usuario.id)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargandoHistorial.set(false)))
            .subscribe({
                next: datos => this.historialCargas.set(datos),
                error: () => this.errorHistorial.set('No se pudo cargar el historial.'),
            });
    }

    private guardarHistorial(item: ArchivoGenerado, secciones: string[], totalDocumentos: number): void {
        this.enviandoHistorial.set(true);
        this.service.enviarHistorial(item.blob, item.nombre, secciones, totalDocumentos)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.enviandoHistorial.set(false)))
            .subscribe({
                next: () => this.cargarHistorial(),
                error: () => this.mostrarMensaje('El Excel se descargó, pero no se pudo guardar en el historial.', 'error'),
            });
    }

    volverADescargar(item: HistorialDescarga): void {
        if (this.descargandoId() !== null) return;
        this.descargandoId.set(item.id);
        this.service.descargarHistorial(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.descargandoId.set(null)))
            .subscribe({
                next: blob => this.service.descargarBlob(blob, item.archivo),
                error: () => this.mostrarMensaje('No se pudo descargar el archivo del historial.', 'error'),
            });
    }

    // ---------- Mensajes ----------
    private mostrarMensaje(texto: string, tipo: TipoMensaje): void {
        this.mensaje.set(texto);
        this.tipoMensaje.set(tipo);
    }

    private limpiarMensaje(): void {
        this.mensaje.set('');
        this.tipoMensaje.set(null);
        this.mostrarReintentar.set(false);
    }
}
