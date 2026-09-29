import { Injectable } from '@angular/core';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_BYTES, ValidacionArchivo } from '../interfaces/consultas-masivas';

@Injectable({
    providedIn: 'root',
})
export class ValidacionService {

    validar(archivo: File): ValidacionArchivo {
        const extension = this.obtenerExtension(archivo.name);

        if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
            return { valido: false, mensajeError: 'Solo se permiten archivos .txt o .csv.' };
        }
        if (archivo.size === 0) {
            return { valido: false, mensajeError: 'El archivo está vacío.' };
        }
        if (archivo.size > TAMANO_MAXIMO_BYTES) {
            return { valido: false, mensajeError: 'El archivo supera el límite de 5MB.' };
        }
        return { valido: true };
    }

    private obtenerExtension(nombreArchivo: string): string {
        const partes = nombreArchivo.split('.');
        return '.' + partes[partes.length - 1].toLowerCase();
    }
}
