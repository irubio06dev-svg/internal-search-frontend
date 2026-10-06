import { AnalisisDocumentos } from '../../../shared/utils/analizar-documentos';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_BYTES, ValidacionArchivo } from '../interfaces/masivas-empresas.interface';

/** Valida el formato del RUC; la existencia la resuelve el backend. */
export function analizarRucs(texto: string): AnalisisDocumentos {
    const unicos = new Set<string>();
    const invalidos: string[] = [];
    let duplicados = 0;
    for (const token of texto.split(/[\s,;|]+/)) {
        const valor = token.replace(/["']/g, '').trim();
        if (!valor || /^ruc$/i.test(valor)) continue;
        if (!/^(10|15|16|17|20)\d{9}$/.test(valor)) {
            invalidos.push(valor);
        } else if (unicos.has(valor)) {
            duplicados++;
        } else {
            unicos.add(valor);
        }
    }
    return {
        validos: [...unicos], invalidos, duplicados, completados: 0,
        porTipo: unicos.size ? [{ nombre: 'RUC', cantidad: unicos.size }] : [],
    };
}

export function validarArchivoRucs(archivo: File): ValidacionArchivo {
    const extension = archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension))
        return { valido: false, mensajeError: 'Solo se permiten archivos .txt o .csv.' };
    if (!archivo.size) return { valido: false, mensajeError: 'El archivo está vacío.' };
    if (archivo.size > TAMANO_MAXIMO_BYTES)
        return { valido: false, mensajeError: 'El archivo supera el límite permitido (5 MB, incluido el formulario).' };
    return { valido: true };
}
