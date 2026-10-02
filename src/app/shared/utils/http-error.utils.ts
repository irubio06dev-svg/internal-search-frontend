import { HttpErrorResponse } from '@angular/common/http';

// Mensaje legible a partir de las distintas formas de error del backend:
// { message }, ProblemDetails con { errors: { campo: [msg] } } o { title }.
export function mensajeError(err: unknown, porDefecto = 'No se pudo completar la operación.'): string {
    const e = (err as HttpErrorResponse)?.error;

    if (typeof e?.message === 'string') return e.message;

    if (e?.errors && typeof e.errors === 'object') {
        const primero = Object.values(e.errors as Record<string, string[]>)[0];
        if (Array.isArray(primero) && primero.length) return primero[0];
    }

    if (typeof e?.title === 'string') return e.title;
    return porDefecto;
}

// El backend guarda auditoría y movimientos en UTC pero serializa sin "Z":
// sin este ajuste el navegador los mostraría como hora local.
export function fechaUtc(valor: string | null | undefined): Date | null {
    if (!valor) return null;
    return new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(valor) ? valor : `${valor}Z`);
}
