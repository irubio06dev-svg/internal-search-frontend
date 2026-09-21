import Swal from 'sweetalert2';

export class AlertUtils {
    static confirm(title: string, text: string, confirm: string, cancel: string): Promise<boolean> {
        return Swal.fire({
            title,
            text,
            icon: 'question',
            iconColor: '#911b34',
            showCancelButton: true,
            confirmButtonText: confirm,
            cancelButtonText: cancel,
            reverseButtons: true,
            buttonsStyling: false,
            focusCancel: true,
            customClass: {
                popup: 'swal-popup-custom',
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
