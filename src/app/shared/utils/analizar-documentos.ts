// =====================================================================
// CONFIGURACIÓN DE TIPOS DE DOCUMENTO
// Ajusta esta lista a los documentos que acepta tu backend.
// El orden importa: se asigna el PRIMER tipo cuyo patrón coincida.
// =====================================================================
export interface TipoDocumento { id: string; nombre: string; patron: RegExp; }

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
    { id: 'dni', nombre: 'DNI', patron: /^\d{8}$/ },
    { id: 'ruc', nombre: 'RUC', patron: /^(10|15|16|17|20)\d{9}$/ },
    { id: 'ce', nombre: 'Carnet de extranjería', patron: /^\d{9}$/ },
    { id: 'otro', nombre: 'Otros documentos', patron: /^[A-Z0-9-]{4,20}$/ },
];

/** Excel suele quitar el 0 inicial: 01234567 -> 1234567. Si es true, se completa a 8 dígitos como DNI. */
const COMPLETAR_DNI_DE_7_DIGITOS = false;

export const LIMITE_DOCUMENTOS = 10_000;

const SEPARADORES = /[\s,;|]+/;
const ENCABEZADOS_IGNORADOS = /^(dni|ruc|ce|pasaporte|documento|documentos|nro|numero|número|tipo)$/i;

export interface AnalisisDocumentos {
    validos: string[];                       // Documentos únicos y válidos
    invalidos: string[];                     // Valores que no coinciden con ningún tipo
    duplicados: number;                      // Repetidos que se omiten
    completados: number;                     // DNI de 7 dígitos completados con 0
    porTipo: { nombre: string; cantidad: number }[];
}

/** Separa, normaliza, valida y clasifica los documentos de un texto (pegado o leído de un archivo). */
export function analizarDocumentos(texto: string): AnalisisDocumentos {
    const vistos = new Set<string>();
    const invalidos: string[] = [];
    const conteo = new Map<string, number>();
    let duplicados = 0;
    let completados = 0;

    for (const bruto of texto.split(SEPARADORES)) {
        let valor = bruto.replace(/["']/g, '').trim().toUpperCase();
        if (!valor || ENCABEZADOS_IGNORADOS.test(valor)) continue;

        if (COMPLETAR_DNI_DE_7_DIGITOS && /^\d{7}$/.test(valor)) {
            valor = valor.padStart(8, '0');
            completados++;
        }

        const tipo = TIPOS_DOCUMENTO.find(t => t.patron.test(valor));
        if (!tipo) {
            invalidos.push(bruto);
            continue;
        }

        if (vistos.has(valor)) {
            duplicados++;
            continue;
        }

        vistos.add(valor);
        conteo.set(tipo.nombre, (conteo.get(tipo.nombre) ?? 0) + 1);
    }

    const porTipo = TIPOS_DOCUMENTO
        .filter(t => conteo.has(t.nombre))
        .map(t => ({ nombre: t.nombre, cantidad: conteo.get(t.nombre)! }));

    return { validos: [...vistos], invalidos, duplicados, completados, porTipo };
}

/** Convierte una lista de documentos en un TXT para reutilizar el mismo endpoint del backend. */
export function crearArchivoDocumentos(documentos: string[]): File {
    const contenido = documentos.join('\r\n') + '\r\n';
    const f = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const nombre = `Documentos_pegados_${f.getFullYear()}${p(f.getMonth() + 1)}${p(f.getDate())}_${p(f.getHours())}${p(f.getMinutes())}.txt`;
    return new File([contenido], nombre, { type: 'text/plain' });
}

export const formatearNumero = (n: number) => n.toLocaleString('es-PE');
