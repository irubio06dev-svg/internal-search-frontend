import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export class RepeatedMethodUtils {
    static errorMessage = signal<string>('Por favor revise sus credenciales.');
    static hasError = signal<boolean>(false);
    static alertType = signal<'warning' | 'danger'>('danger');

    constructor() {}

    // Elige el mensaje del login según lo que pasó. Antes esta función estaba vacía y la pantalla mostraba
    // siempre "revise sus credenciales", incluso cuando el servidor estaba caído o sin internet.
    static loginError(err: HttpErrorResponse) {
        const mensajeServidor = (err?.error as { message?: string } | null | undefined)?.message;
        const estado = err?.status ?? 0;

        if (estado === 0) {
            // Sin respuesta: el servidor está apagado o sin internet, o el navegador bloqueó la llamada
            this.errorMessage.set('No se pudo conectar con el servidor. Revisa tu conexión a internet o inténtalo de nuevo en unos minutos.');
            this.alertType.set('warning');
        } else if (estado === 429) {
            this.errorMessage.set('Demasiados intentos. Espera un minuto antes de volver a intentarlo.');
            this.alertType.set('warning');
        } else if (estado >= 500) {
            this.errorMessage.set('El servidor tuvo un problema. Inténtalo de nuevo en unos minutos; si continúa, avisa a soporte.');
            this.alertType.set('warning');
        } else if (estado === 401) {
            this.errorMessage.set(mensajeServidor ?? 'Usuario o contraseña incorrectos.');
            this.alertType.set('danger');
        } else {
            this.errorMessage.set(mensajeServidor ?? 'No fue posible iniciar sesión.');
            this.alertType.set('danger');
        }
    }
}
