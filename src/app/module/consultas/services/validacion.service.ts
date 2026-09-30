import { Injectable } from '@angular/core';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_BYTES, ValidacionArchivo } from '../interfaces/consultas-masivas';
export const REGEX_NOMBRE_PLANTILLA = /^Plantilla_DNI(?: \(\d+\))?\.(txt|csv)$/i;
export const REGEX_DNI_LINEA = /^\d{8}$/;
export const MAX_LINEAS_INVALIDAS_MOSTRADAS = 3;

export interface ResultadoContenido {
    valido: boolean;
    mensajeError?: string;
    dnis: string[];           // únicos
    totalLineas: number;
}

@Injectable({ 
    providedIn: 'root' 
})
export class ValidacionService {

    validar(archivo: File): ValidacionArchivo {
        if (!EXTENSIONES_PERMITIDAS.includes(this.obtenerExtension(archivo.name)))
            return { valido: false, mensajeError: 'Solo se permiten archivos .txt o .csv.' };

        if (!REGEX_NOMBRE_PLANTILLA.test(archivo.name))
            return { valido: false, mensajeError: 'Usa el archivo de la plantilla: Plantilla_DNI.txt o Plantilla_DNI.csv.' };

        if (archivo.size === 0)
            return { valido: false, mensajeError: 'El archivo está vacío.' };

        if (archivo.size > TAMANO_MAXIMO_BYTES)
            return { valido: false, mensajeError: 'El archivo supera el límite de 5 MB.' };

        return { valido: true };
    }

    validarContenido(texto: string): ResultadoContenido {
        const lineas = texto
            .replace(/^\uFEFF/, '')                       // quita BOM
            .split(/\r\n|\n|\r/)
            .map(l => l.trim().replace(/^["']|["']$/g, '')) // quita comillas del CSV
            .filter(l => l.length > 0);

        if (lineas.length === 0)
            return { valido: false, mensajeError: 'El archivo no contiene datos.', dnis: [], totalLineas: 0 };

        const invalidas = lineas
            .map((valor, i) => ({ valor, linea: i + 1 }))
            .filter(x => !REGEX_DNI_LINEA.test(x.valor));

        if (invalidas.length > 0) {
            const ejemplos = invalidas
                .slice(0, MAX_LINEAS_INVALIDAS_MOSTRADAS)
                .map(x => `línea ${x.linea}`)
                .join(', ');
            const resto = invalidas.length > MAX_LINEAS_INVALIDAS_MOSTRADAS ? ' y otras' : '';
            return {
                valido: false,
                mensajeError: `El archivo debe tener un DNI de 8 dígitos por línea. Revisa: ${ejemplos}${resto}.`,
                dnis: [],
                totalLineas: lineas.length,
            };
        }

        return { valido: true, dnis: [...new Set(lineas)], totalLineas: lineas.length };
    }


    private obtenerExtension(nombre: string): string {
        const i = nombre.lastIndexOf('.');
        return i === -1 ? '' : nombre.slice(i).toLowerCase();
    }
}