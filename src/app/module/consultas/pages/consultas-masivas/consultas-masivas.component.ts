import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, TimeoutError, finalize } from 'rxjs';
import { EstadoCarga, TipoMensaje } from '../../interfaces/consultas-masivas';
import { ConsultasMasivasService } from '../../services/consultas-masiva.service';
import { ValidacionService } from '../../services/validacion.service';
import { DrapDropDirective } from '../../directives/drap-drop.directive';
import { FileSizePipePipe } from '../../../../core/pipes/FileSizePipe-pipe.pipe';

interface CargaReciente { nombre: string; fecha: Date; blob: Blob; }

@Component({
    selector: 'app-consultas-masivas',
    imports: [CommonModule, DrapDropDirective, FileSizePipePipe],
    templateUrl: './consultas-masivas.component.html',
    styleUrl: './consultas-masivas.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultasMasivasComponent {
    // Los ids deben coincidir con SeccionesMasivo del backend
    readonly opciones = [
        { id: 'moviles', nombre: 'Teléfonos', detalle: 'Números, operadoras y planes.' },
        { id: 'sueldos', nombre: 'Información laboral', detalle: 'Empresas e ingresos reportados.' },
        { id: 'deuda', nombre: 'Deudas', detalle: 'Entidades, saldos y períodos.' },
        { id: 'lineas-credito', nombre: 'Líneas de crédito', detalle: 'Montos utilizados y disponibles.' }, // corregido
        { id: 'calificacion', nombre: 'Calificaciones', detalle: 'Clasificación crediticia reportada.' },
    ];
    archivoSeleccionado: File | null = null;
    cantidadLineasDetectadas: number | null = null;
    estado: EstadoCarga = { cargando: false, progreso: 0, mensaje: '' };
    tipoMensaje: TipoMensaje = null;
    mensaje = '';
    mostrarReintentar = false;
    progresoDisponible = false;
    historialCargas: CargaReciente[] = [];
    private readonly cargaMasivaService = inject(ConsultasMasivasService);
    private readonly validacionService = inject(ValidacionService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private subscripcionActual?: Subscription;
    private operacion = 0;

    seccionesSeleccionadas = this.opciones.map(opcion => opcion.id);

    get todasSeleccionadas(): boolean { return this.seccionesSeleccionadas.length === this.opciones.length; }
    get seleccionParcial(): boolean { return this.seccionesSeleccionadas.length > 0 && !this.todasSeleccionadas; }

    seleccionarTodas(marcado: boolean): void {
        if (this.estado.cargando) return;
        this.seccionesSeleccionadas = marcado ? this.opciones.map(opcion => opcion.id) : [];
    }

    seleccionarSeccion(id: string, marcado: boolean): void {
        if (this.estado.cargando) return;
        this.seccionesSeleccionadas = this.opciones
            .filter(opcion => opcion.id === id ? marcado : this.seccionesSeleccionadas.includes(opcion.id))
            .map(opcion => opcion.id);
    }

    constructor() {
        this.destroyRef.onDestroy(() => this.subscripcionActual?.unsubscribe());
    }

    get mostrarAdvertenciaVolumen(): boolean {
        return (this.cantidadLineasDetectadas ?? 0) > 2000;
    }

    onFilesDropped(files: FileList): void {
        if (this.estado.cargando || !files.length) return;
        if (files.length !== 1) {
            this.mostrarMensaje('Selecciona un solo archivo.', 'error');
            return;
        }
        void this.seleccionarArchivo(files[0]);
    }

    onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];
        input.value = '';
        if (archivo) void this.seleccionarArchivo(archivo);
    }

    private async seleccionarArchivo(archivo: File): Promise<void> {
        if (this.estado.cargando) return;
        this.operacion++;
        this.limpiarMensaje();
        const validacion = this.validacionService.validar(archivo);
        if (!validacion.valido) {
            this.mostrarMensaje(validacion.mensajeError ?? 'Archivo no permitido.', 'error');
            return;
        }
        this.archivoSeleccionado = archivo;
        this.cantidadLineasDetectadas = null;
        try {
            const cantidad = await this.contarLineas(archivo);
            if (this.destroyRef.destroyed || this.archivoSeleccionado !== archivo) return;
            this.cantidadLineasDetectadas = cantidad;
        } catch {
            if (this.destroyRef.destroyed || this.archivoSeleccionado !== archivo) return;
            this.archivoSeleccionado = null;
            this.mostrarMensaje('No se pudo leer el archivo. Selecciona otro.', 'error');
        }
        if (!this.destroyRef.destroyed) this.cdr.markForCheck();
    }

    quitarArchivo(): void {
        if (this.estado.cargando) return;
        this.operacion++;
        this.archivoSeleccionado = null;
        this.cantidadLineasDetectadas = null;
        this.limpiarMensaje();
    }

    procesarArchivo(): void {
        if (!this.archivoSeleccionado || this.estado.cargando || !this.seccionesSeleccionadas.length) return;
        const operacion = ++this.operacion;
        this.progresoDisponible = false;
        this.limpiarMensaje();
        this.estado = { cargando: true, progreso: 0, mensaje: 'Enviando archivo y preparando Excel...' };
        this.subscripcionActual = this.cargaMasivaService.exportarMasivo(this.archivoSeleccionado, this.seccionesSeleccionadas)
            .pipe(finalize(() => {
                this.estado = { cargando: false, progreso: 0, mensaje: '' };
                if (!this.destroyRef.destroyed) this.cdr.markForCheck();
            }))
            .subscribe({
                next: evento => {
                    if (evento.tipo === 'progreso' && evento.porcentaje !== undefined) {
                        this.progresoDisponible = evento.porcentaje > 0 && evento.porcentaje < 100;
                        this.estado = {
                            cargando: true, progreso: evento.porcentaje,
                            mensaje: evento.porcentaje >= 100 ? 'Archivo enviado. Preparando Excel...' : `Subiendo... ${evento.porcentaje}%`
                        };
                    } else if (evento.tipo === 'completado') {
                        if (!evento.archivo?.size) {
                            this.mostrarMensaje('El servidor no devolvió un archivo Excel.', 'error');
                        } else {
                            const item = { nombre: evento.nombreArchivo ?? 'Resultado_Masivo.xlsx', fecha: new Date(), blob: evento.archivo };
                            this.historialCargas = [item, ...this.historialCargas].slice(0, 5);
                            this.volverADescargar(item);
                            this.archivoSeleccionado = null;
                            this.cantidadLineasDetectadas = null;
                            this.mostrarMensaje('Excel generado. Se inició la descarga.', 'success');
                        }
                    }
                    this.cdr.markForCheck();
                },
                error: async err => {
                    const mensaje = err instanceof TimeoutError
                        ? 'El servidor no terminó la consulta en cinco minutos. Puedes reintentar o probar con menos documentos.'
                        : err.error instanceof Blob
                            ? await this.cargaMasivaService.leerMensajeError(err.error)
                            : 'No se pudo completar la solicitud.';
                    if (this.destroyRef.destroyed || operacion !== this.operacion) return;
                    this.mostrarReintentar = err instanceof TimeoutError || err.status === 0 || err.status === 408 || err.status === 429 || err.status >= 500;
                    this.mostrarMensaje(mensaje, 'error');
                },
            });
    }

    cancelarCarga(): void {
        this.operacion++;
        this.subscripcionActual?.unsubscribe();
        this.limpiarMensaje();
    }

    reintentar(): void {
        if (this.mostrarReintentar) this.procesarArchivo();
    }

    descargarPlantilla(): void {
        this.cargaMasivaService.descargarBlob(new Blob(['00000000\r\n00000001\r\n'], { type: 'text/csv;charset=utf-8' }), 'Plantilla_DNI.csv');
    }

    volverADescargar(item: CargaReciente): void {
        this.cargaMasivaService.descargarBlob(item.blob, item.nombre);
    }

    async contarLineas(archivo: File): Promise<number> {
        return (await archivo.text()).split(/\r\n|\n|\r/).filter(linea => linea.trim().length > 0).length;
    }

    private mostrarMensaje(texto: string, tipo: TipoMensaje): void {
        this.mensaje = texto;
        this.tipoMensaje = tipo;
        this.cdr.markForCheck();
    }

    private limpiarMensaje(): void {
        this.mensaje = '';
        this.tipoMensaje = null;
        this.mostrarReintentar = false;
    }
}