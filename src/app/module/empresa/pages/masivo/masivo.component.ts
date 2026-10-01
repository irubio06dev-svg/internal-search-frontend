import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { Subscription, TimeoutError, finalize } from 'rxjs';
import { HistorialDescarga } from '../../../personas/interfaces/historial.interface';
import { EstadoCarga, TipoMensaje } from '../../../personas/interfaces/consultas-masivas';
import { ConsultasMasivasService } from '../../../personas/services/consultas-masiva.service';
import { DrapDropDirective } from '../../../personas/directives/drap-drop.directive';
import { FileSizePipePipe } from '../../../../core/pipes/FileSizePipe-pipe.pipe';

interface ArchivoGenerado { nombre: string; blob: Blob; }

const REGEX_RUC = /(?<!\d)\d{11}(?!\d)/g;

@Component({
  selector: 'app-masivo',
  imports: [CommonModule, DrapDropDirective, FileSizePipePipe],
  templateUrl: './masivo.component.html',
  styleUrl: './masivo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasivoComponent implements OnInit {
  private readonly service = inject(ConsultasMasivasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private subscripcionActual?: Subscription;

  readonly opciones = [
    { id: 'moviles', nombre: 'Teléfonos', detalle: 'Números, operadoras y planes.' },
    { id: 'sueldos', nombre: 'Información laboral', detalle: 'Empresas e ingresos reportados.' },
    { id: 'deuda', nombre: 'Deudas', detalle: 'Entidades, saldos y períodos.' },
    { id: 'lineas-credito', nombre: 'Líneas de crédito', detalle: 'Montos utilizados y disponibles.' },
    { id: 'calificacion', nombre: 'Calificaciones', detalle: 'Clasificación crediticia reportada.' },
  ];

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
  private readonly totalDnisDetectados = signal<number>(0);
  readonly todasSeleccionadas = computed(() => this.seccionesSeleccionadas().length === this.opciones.length);
  readonly seleccionParcial = computed(() => this.seccionesSeleccionadas().length > 0 && !this.todasSeleccionadas());
  readonly mostrarAdvertenciaVolumen = computed(() => (this.cantidadLineasDetectadas() ?? 0) > 2000);
  readonly extensionArchivo = computed(() => this.archivoSeleccionado()?.name.split('.').pop()?.toUpperCase() ?? '');
  readonly puedeProcesar = computed(() => !!this.archivoSeleccionado() && !this.estado().cargando && !this.enviandoHistorial() && this.cantidadLineasDetectadas() !== null && this.seccionesSeleccionadas().length > 0 && this.totalDnisDetectados() > 0);
  readonly textoBotonProcesar = computed(() => this.enviandoHistorial() ? 'Enviando historial...' : this.estado().cargando ? 'Procesando...' : 'Procesar y descargar Excel');

  static extraerRucsDesdeTexto(texto: string): string[] {
    return [...new Set((texto.match(REGEX_RUC) ?? []).map(ruc => ruc.trim()))];
  }

  ngOnInit(): void { this.cargarHistorial(); }

  nombreSeccion(id: string): string {
    return this.opciones.find(o => o.id === id)?.nombre ?? id;
  }

  seleccionarTodas(marcado: boolean): void {
    if (this.estado().cargando) return;
    this.seccionesSeleccionadas.set(marcado ? this.opciones.map(o => o.id) : []);
  }

  seleccionarSeccion(id: string, marcado: boolean): void {
    if (this.estado().cargando) return;
    const sinId = this.seccionesSeleccionadas().filter(s => s !== id);
    this.seccionesSeleccionadas.set(marcado ? [...sinId, id] : sinId);
  }

  onFilesDropped(files: FileList): void {
    if (this.estado().cargando || !files.length) return;
    if (files.length !== 1) return this.mostrarMensaje('Selecciona un solo archivo.', 'error');
    void this.seleccionarArchivo(files[0]);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (archivo) void this.seleccionarArchivo(archivo);
  }

  private async seleccionarArchivo(archivo: File): Promise<void> {
    if (this.estado().cargando || this.enviandoHistorial()) return;

    this.limpiarMensaje();

    const extension = archivo.name.includes('.') ? archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase() : '';
    if (!['.txt', '.csv'].includes(extension)) {
      return this.mostrarMensaje('Solo se permiten archivos .txt o .csv.', 'error');
    }

    if (archivo.size === 0) {
      return this.mostrarMensaje('El archivo está vacío.', 'error');
    }

    if (archivo.size > 5 * 1024 * 1024) {
      return this.mostrarMensaje('El archivo supera el límite de 5 MB.', 'error');
    }

    this.archivoSeleccionado.set(archivo);
    this.cantidadLineasDetectadas.set(null);

    try {
      const texto = await archivo.text();

      if (this.archivoSeleccionado() !== archivo) return;

      const rucs = MasivoComponent.extraerRucsDesdeTexto(texto);
      const totalRucs = new Set(rucs).size;

      this.totalDnisDetectados.set(totalRucs);
      this.cantidadLineasDetectadas.set(
        texto.split(/\r\n|\n|\r/).filter(linea => linea.trim()).length
      );

      if (totalRucs === 0) {
        this.archivoSeleccionado.set(null);
        this.mostrarMensaje('El archivo no contiene RUCs válidos.', 'error');
        return;
      }
    } catch {
      if (this.archivoSeleccionado() !== archivo) return;

      this.archivoSeleccionado.set(null);
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
    this.totalDnisDetectados.set(0);
  }

  procesarArchivo(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo || this.estado().cargando || this.enviandoHistorial() || this.cantidadLineasDetectadas() === null || !this.seccionesSeleccionadas().length) return;

    if (!this.totalDnisDetectados()) {
      return this.mostrarMensaje('No se detectaron RUC de 11 dígitos en el archivo.', 'error');
    }

    const secciones = [...this.seccionesSeleccionadas()];
    const totalRucs = this.totalDnisDetectados();

    this.limpiarMensaje();
    this.progresoDisponible.set(false);
    this.estado.set({ cargando: true, progreso: 0, mensaje: 'Enviando archivo y preparando Excel...' });

    this.subscripcionActual = this.service.exportarMasivo(archivo, secciones)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.estado.set({ cargando: false, progreso: 0, mensaje: '' });
        }),
      )
      .subscribe({
        next: evento => {
          if (evento.tipo === 'progreso' && evento.porcentaje !== undefined) {
            const p = evento.porcentaje;
            this.progresoDisponible.set(p > 0 && p < 100);
            this.estado.set({
              cargando: true,
              progreso: p,
              mensaje: p >= 100 ? 'Archivo enviado. Preparando Excel...' : `Subiendo... ${p}%`,
            });
          } else if (evento.tipo === 'completado') {
            this.alCompletar(evento.archivo, evento.nombreArchivo, secciones, totalRucs);
          }
        },
        error: err => void this.alError(err),
      });
  }

  private alCompletar(blob: Blob | undefined, nombre: string | undefined, secciones: string[], totalRucs: number): void {
    if (!blob?.size) return this.mostrarMensaje('El servidor no devolvió un archivo Excel.', 'error');

    const item: ArchivoGenerado = { nombre: nombre ?? 'Resultado_Masivo.xlsx', blob };
    this.service.descargarBlob(item.blob, item.nombre);
    this.resetArchivo();
    this.mostrarMensaje('Excel generado. Se inició la descarga.', 'success');
    this.guardarHistorial(item, secciones, totalRucs);
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
    this.subscripcionActual?.unsubscribe();
    this.limpiarMensaje();
  }

  reintentar(): void {
    if (this.mostrarReintentar()) this.procesarArchivo();
  }

  cargarHistorial(): void {
    const usuario = this.authService.user();
    if (!usuario) return;
    this.cargandoHistorial.set(true);
    this.errorHistorial.set('');
    this.service.obtenerHistorial(usuario.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoHistorial.set(false);
        }),
      )
      .subscribe({
        next: datos => this.historialCargas.set(datos),
        error: () => this.errorHistorial.set('No se pudo cargar el historial.'),
      });
  }

  private guardarHistorial(item: ArchivoGenerado, secciones: string[], totalRucs: number): void {
    this.enviandoHistorial.set(true);
    this.service.enviarHistorial(item.blob, item.nombre, secciones, totalRucs)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.enviandoHistorial.set(false);
        }),
      )
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

  descargarPlantilla(formato: 'txt' | 'csv'): void {
    const contenido = '20123456789\r\n20456789012\r\n';
    const tipo = formato === 'txt' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8';

    this.service.descargarBlob(
      new Blob([contenido], { type: tipo }),
      `Plantilla_RUC.${formato}`,
    );
  }

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




