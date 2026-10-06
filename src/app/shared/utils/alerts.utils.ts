import Swal from 'sweetalert2';

export class AlertUtils {
    static confirm(title: string, text: string, confirm: string, cancel: string, theme: 'default' | 'corporate' = 'default'): Promise<boolean> {
        return Swal.fire({
            title,
            text,
            icon: 'question',
            iconColor: theme === 'corporate' ? '#154f91' : '#911b34',
            showCancelButton: true,
            confirmButtonText: confirm,
            cancelButtonText: cancel,
            reverseButtons: true,
            buttonsStyling: false,
            focusCancel: true,
            customClass: {
                popup: theme === 'corporate' ? 'swal-popup-custom swal-corporate' : 'swal-popup-custom',
                title: 'swal-title-custom',
                htmlContainer: 'swal-text-custom',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn',
                icon: 'swal-icon-custom',
            },
            showClass: {
                popup: 'swal-fade-in',
            },
            hideClass: {
                popup: 'swal-fade-out',
            },
        }).then((result) => result.isConfirmed);
    }

    private static readonly customClass = {
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        htmlContainer: 'swal-text-custom',
        confirmButton: 'swal-confirm-btn',
        icon: 'swal-icon-custom',
    };

    static success(title: string, text = ''): Promise<boolean> {
        return Swal.fire({
            title,
            text,
            icon: 'success',
            iconColor: '#1B4589',
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: AlertUtils.customClass,
        }).then((result) => result.isConfirmed);
    }

    static error(title: string, text = ''): Promise<boolean> {
        return Swal.fire({
            title,
            text,
            icon: 'error',
            iconColor: '#ED1C24',
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: AlertUtils.customClass,
        }).then((result) => result.isConfirmed);
    }

    static sinTokens(saldo?: number, costo?: number): Promise<boolean> {
        const detalle = saldo !== undefined && costo !== undefined
            ? ` Tienes ${saldo} token(s) y esta consulta cuesta ${costo}.`
            : '';

        return Swal.fire({
            title: 'Sin tokens disponibles',
            text: `Solicita a un administrador que te asigne más tokens.${detalle}`,
            icon: 'info',
            iconColor: '#1B4589',
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: AlertUtils.customClass,
        }).then((result) => result.isConfirmed);
    }

    private static ultimoAvisoSinConexion = 0;

    // Aviso discreto (no bloquea la pantalla) cuando no hay respuesta del servidor. Se muestra uno solo cada 15 s
    // para que, si varias peticiones fallan a la vez, no se acumulen avisos.
    static sinConexion(): void {
        const ahora = Date.now();
        if (ahora - AlertUtils.ultimoAvisoSinConexion < 15000) return;
        AlertUtils.ultimoAvisoSinConexion = ahora;

        void Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            iconColor: '#b45309',
            title: 'Sin conexión con el servidor',
            text: 'Revisa tu internet o inténtalo de nuevo en unos minutos.',
            showConfirmButton: false,
            timer: 8000,
            timerProgressBar: true,
        });
    }

    static sessionExpired(): Promise<boolean> {
        return Swal.fire({
            title: 'Sesión expirada',
            text: 'Tu sesión ha finalizado por seguridad. Por favor, inicia sesión nuevamente.',
            icon: 'warning',
            iconColor: '#f59e0b',
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            allowOutsideClick: false,
            customClass: {
                popup: 'swal-popup-custom',
                title: 'swal-title-custom',
                htmlContainer: 'swal-text-custom',
                confirmButton: 'swal-confirm-btn',
                icon: 'swal-icon-custom',
            },
        }).then((result) => result.isConfirmed);
    }
}
