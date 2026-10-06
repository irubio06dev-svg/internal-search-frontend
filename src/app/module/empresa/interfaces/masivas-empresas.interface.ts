export const EXTENSIONES_PERMITIDAS = ['.txt', '.csv'];
export const TAMANO_MAXIMO_BYTES = 4_990_000; // Reserva espacio para multipart dentro de RequestSizeLimit(5_000_000)

export interface ValidacionArchivo {
  valido: boolean;
  mensajeError?: string;
}

export interface EstadoCarga {
  cargando: boolean;
  progreso: number;
  mensaje: string;
}

export interface ProgresoSubida {
  tipo: 'progreso' | 'completado';
  porcentaje?: number;
  archivo?: Blob;
  nombreArchivo?: string;
}

export type TipoMensaje = 'success' | 'error' | null;