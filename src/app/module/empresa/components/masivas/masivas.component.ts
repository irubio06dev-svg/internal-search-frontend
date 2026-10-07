import { ChangeDetectionStrategy, Component, DestroyRef, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, TimeoutError, finalize } from 'rxjs';
import { EstadoCarga, TipoMensaje } from '../../interfaces/masivas-empresas.interface';
import { ConsultasMasivasEmpresaService } from '../../services/consultas-masivas-empresa.service';


import { PageHeaderComponent } from '../../../personas/components/masivas/page-header/page-header.component';
import { CardHeadingComponent } from '../../../personas/components/masivas/card-heading/card-heading.component';
import { ModoEntrada, SelectorModoComponent } from '../../../personas/components/masivas/selector-modo/selector-modo.component';
import { PegarDocumentosComponent } from '../../../personas/components/masivas/pegar-documentos/pegar-documentos.component';
import { ProgresoCargaComponent } from '../../../personas/components/masivas/progreso-carga/progreso-carga.component';
import { AlertaComponent } from '../../../personas/components/masivas/alerta/alerta.component';
import { OpcionSeccion, SelectorSeccionesComponent } from '../../../personas/components/masivas/selector-secciones/selector-secciones.component';
import { FileDropzoneComponent } from '../../../personas/components/masivas/file-dropzone/file-dropzone.component';
import { ArchivoSeleccionadoComponent } from '../../../personas/components/masivas/archivo-seleccionado/archivo-seleccionado.component';
import { crearArchivoDocumentos, formatearNumero, LIMITE_DOCUMENTOS } from '../../../../shared/utils/analizar-documentos';

import { analizarRucs, validarArchivoRucs } from '../../utils/analizar-rucs';
import { CommonModule } from '@angular/common';

interface ArchivoGenerado { nombre: string; blob: Blob; }

@Component({
    selector: 'app-masivas',
    imports: [
        PageHeaderComponent, CardHeadingComponent, SelectorModoComponent, PegarDocumentosComponent,
        FileDropzoneComponent, ArchivoSeleccionadoComponent, ProgresoCargaComponent, AlertaComponent, SelectorSeccionesComponent,
    ],
    templateUrl: './masivas.component.html',
    styleUrl: './masivas.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasivasComponent {
    private readonly service = inject(ConsultasMasivasEmpresaService);
    private readonly destroyRef = inject(DestroyRef);
    private subscripcionActual?: Subscription;

    // Los ids deben coincidir con SeccionesMasivoEmpresa del backend
    readonly opciones: OpcionSeccion[] = [
        { id: 'moviles', nombre: 'Teléfonos', detalle: 'Números, operadoras y planes.' },
        { id: 'sueldos', nombre: 'Información laboral', detalle: 'Empresas e ingresos reportados.' },
        { id: 'deuda', nombre: 'Deudas', detalle: 'Entidades, saldos y períodos.' },
        { id: 'lineas-credito', nombre: 'Líneas de crédito', detalle: 'Montos utilizados y disponibles.' },
        { id: 'calificacion', nombre: 'Calificaciones', detalle: 'Clasificación crediticia reportada.' },
    ];

    readonly limiteDocumentos = LIMITE_DOCUMENTOS;
    readonly tiposAceptados = 'RUC de 11 dígitos';

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
    private readonly rucsArchivo = signal<string[]>([]);
    private readonly totalDocumentosArchivo = signal<number>(0);

    // ---------- Derivados ----------
    readonly analisisPegado = computed(() => analizarRucs(this.textoPegado()));

    readonly excedeLimite = computed(() =>
        this.modoEntrada() === 'pegar' && this.analisisPegado().validos.length > LIMITE_DOCUMENTOS);

    readonly totalDocumentos = computed(() =>
        this.modoEntrada() === 'pegar' ? this.analisisPegado().validos.length : this.totalDocumentosArchivo());

    readonly mostrarAdvertenciaVolumen = computed(() =>
        this.modoEntrada() === 'pegar'
            ? this.analisisPegado().validos.length > 2000 && !this.excedeLimite()
            : (this.cantidadLineasDetectadas() ?? 0) > 2000);

    readonly puedeProcesar = computed(() => {
        if (this.estado().cargando || !this.seccionesSeleccionadas().length) return false;

        return this.modoEntrada() === 'pegar'
            ? this.analisisPegado().validos.length > 0 && !this.excedeLimite()
            : !!this.archivoSeleccionado() && this.cantidadLineasDetectadas() !== null && this.totalDocumentosArchivo() > 0;
    });

    readonly textoBotonProcesar = computed(() => {
        if (this.estado().cargando) return 'Procesando...';
        const total = this.totalDocumentos();
        return total > 0 && !this.excedeLimite()
            ? `Procesar ${formatearNumero(total)} RUC y descargar Excel`
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
        if (this.estado().cargando) return;

        this.limpiarMensaje();

        const { valido, mensajeError } = validarArchivoRucs(archivo);
        if (!valido) return this.mostrarMensaje(mensajeError ?? 'Archivo no permitido.', 'error');

        this.archivoSeleccionado.set(archivo);
        this.cantidadLineasDetectadas.set(null);

        try {
            const texto = await archivo.text();
            if (this.archivoSeleccionado() !== archivo) return;

            const analisis = analizarRucs(texto);
            if (analisis.invalidos.length) {
                this.resetArchivo();
                return this.mostrarMensaje(`El archivo contiene valores que no son RUC de 11 dígitos: ${analisis.invalidos.slice(0, 3).join(', ')}. Corrige el archivo y vuelve a cargarlo.`, 'error');
            }
            const total = analisis.validos.length;
            this.totalDocumentosArchivo.set(total);
            this.rucsArchivo.set(analisis.validos);
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
        this.rucsArchivo.set([]);
    }

    descargarPlantilla(formato: 'txt' | 'csv'): void {
        const contenido = '20100070970\r\n20100047218\r\n';
        const tipo = formato === 'txt' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8';
        this.service.descargarBlob(new Blob([contenido], { type: tipo }), `Plantilla_RUC.${formato}`);
    }

    // ---------- Procesar ----------
    procesar(): void {
        if (!this.puedeProcesar()) return;

        const archivo = this.modoEntrada() === 'pegar'
            ? crearArchivoDocumentos(this.analisisPegado().validos)
            : crearArchivoDocumentos(this.rucsArchivo());
        if (!archivo) return;

        const secciones = [...this.seccionesSeleccionadas()];

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
                        this.alCompletar(evento.archivo, evento.nombreArchivo);
                    }
                },
                error: err => void this.alError(err),
            });
    }

    private alCompletar(blob: Blob | undefined, nombre: string | undefined): void {
        if (!blob?.size) return this.mostrarMensaje('El servidor no devolvió un archivo Excel.', 'error');

        const item: ArchivoGenerado = { nombre: nombre ?? 'Resultado_Empresa_Masivo.xlsx', blob };
        this.service.descargarBlob(item.blob, item.nombre);
        this.resetArchivo();
        this.textoPegado.set('');
        this.mostrarMensaje('Excel generado. Se inició la descarga.', 'success');
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
