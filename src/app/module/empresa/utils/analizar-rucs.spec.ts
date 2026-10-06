import { describe, expect, it } from 'vitest';
import { analizarRucs, validarArchivoRucs } from './analizar-rucs';

describe('analizarRucs', () => {
    it('normaliza CSV, ignora encabezado y elimina duplicados', () => {
        const resultado = analizarRucs('\uFEFFRUC\r\n"20100070970";20100047218\n20100070970');
        expect(resultado.validos).toEqual(['20100070970', '20100047218']);
        expect(resultado.duplicados).toBe(1);
        expect(resultado.invalidos).toEqual([]);
        expect(resultado.porTipo).toEqual([{ nombre: 'RUC', cantidad: 2 }]);
    });
    it('rechaza DNI, CE, texto y RUC con formato incorrecto', () => {
        const resultado = analizarRucs('12345678 001234567 ABC 99100070970 2010007097');
        expect(resultado.validos).toEqual([]);
        expect(resultado.invalidos).toHaveLength(5);
    });
    it('acepta listas vacias sin crear registros', () => {
        expect(analizarRucs('RUC\n  ').validos).toEqual([]);
    });
});

describe('validarArchivoRucs', () => {
    const archivo = (name: string, size: number) => ({ name, size }) as File;
    it('acepta cualquier nombre TXT/CSV sin exigir la plantilla DNI', () => {
        expect(validarArchivoRucs(archivo('empresas.CSV', 30)).valido).toBe(true);
    });
    it('rechaza archivos vacios, formatos ajenos y exceso de tamano', () => {
        expect(validarArchivoRucs(archivo('empresas.txt', 0)).valido).toBe(false);
        expect(validarArchivoRucs(archivo('empresas.xlsx', 20)).valido).toBe(false);
        expect(validarArchivoRucs(archivo('empresas.csv', 5_000_000)).valido).toBe(false);
    });
});
