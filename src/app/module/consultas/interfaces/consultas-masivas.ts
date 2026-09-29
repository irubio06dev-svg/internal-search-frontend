export const EXTENSIONES_PERMITIDAS = ['.txt', '.csv'];
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB, igual que RequestSizeLimit del backend

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