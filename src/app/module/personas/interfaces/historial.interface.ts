export interface RecepcionHistorial {
    mensaje: string;
    datos: {
        codUsuario: number;
        nombreArchivo: string;
        tamanoBytes: number;
        tipoContenido: string;
        secciones: string[];
        totalDnis: number;
    };
}

export interface HistorialDescarga {
    id: number;
    archivo: string;
    secciones: string[];
    totalDnis: number;
    tamanoBytes: number;
    fecha: string;
    // Campos opcionales hasta que el backend los incorpore al historial.
    dnisConResultados?: number | null;
    dnisSinResultados?: number | null;
    duracionSegundos?: number | null;
    estado?: string | null;
}
