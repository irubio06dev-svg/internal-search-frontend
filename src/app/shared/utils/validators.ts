import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const LONGITUDES_POR_TIPO: Readonly<Partial<Record<string, number>>> = {
    DNI: 8,
    RUC: 11,
};

/**
 * Valida que el documento tenga la cantidad exacta de dígitos según el tipo
 * (DNI: 8, RUC: 11). CE y Pasaporte no tienen longitud fija, así que se
 * omiten. `getTipoDocumento` se evalúa en cada corrida para leer siempre
 * el valor más reciente del campo `tipoDocumento`.
 */
export function documentoValidator(getTipoDocumento: () => string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const valor = (control.value ?? '').toString().trim();
        if (!valor) return { required: true };

        const tipo = getTipoDocumento();
        const longitudEsperada = LONGITUDES_POR_TIPO[tipo];

        if (!longitudEsperada) return null;

        if (!/^\d+$/.test(valor)) {
            return { soloNumeros: true };
        }

        if (valor.length !== longitudEsperada) {
            return { longitudDocumento: { requerida: longitudEsperada, actual: valor.length } };
        }

        return null;
    };
}

export function getDocumentoErrorMessage(errors: ValidationErrors | null, tipoDocumento: string): string | null {
    if (!errors) return null;
    // if (errors['required']) return 'El documento es obligatorio.';
    if (errors['soloNumeros']) return 'El documento solo debe contener números.';
    if (errors['longitudDocumento']) {
        return `${tipoDocumento} debe tener ${errors['longitudDocumento'].requerida} dígitos.`;
    }
    return null;
}
