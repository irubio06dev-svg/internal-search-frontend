import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthResponse } from '../../module/auth/interfaces/auth-response.interface';

export class RepeatedMethodUtils {
    static errorMessage = signal<string>('Por favor revise sus credenciales.');
    static hasError = signal<boolean>(false);
    static alertType = signal<'warning' | 'danger'>('danger');

    constructor() {}

    static loginError(err: HttpErrorResponse) {
        const backendResponse = err?.error as Partial<AuthResponse> | undefined;
        const backendSuccess = Number(backendResponse?.estado);

        // if (backendResponse?.message && !Number.isNaN(backendSuccess)) {
        //     this.errorMessage.set(backendResponse.message);
        //     this.alertType.set(backendSuccess === 0 || backendSuccess === 2 ? 'warning' : 'danger');
        
        //     setTimeout(() => {
        //         this.hasError.set(false);
        //     }, 3000);
        //     this.hasError.set(true);
        //     return;
        // }
    }
}
