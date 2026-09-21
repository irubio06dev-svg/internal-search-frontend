import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from '../../module/auth/services/auth.service';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { AlertUtils } from '../../shared/utils/alerts.utils';
import { Router } from '@angular/router';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const authService = inject(AuthService);
    const loadingService = inject(LoadingService);
    const token = authService.token();
    const alertUtils = AlertUtils;
    const router = inject(Router);

    const newReq = req.clone({
        headers: req.headers.append('Authorization', `Bearer ${token}`),
    });

    loadingService.show();
    return next(newReq).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401 && authService.authStatus() === 'authenticated') {
                authService.logout();
                alertUtils.sessionExpired().then((result) => {
                    if (result) {
                        router.navigate(['/auth/login']);
                    }
                });
            }
            return throwError(() => err);
        }),
        finalize(() => loadingService.hide()),
    );

    //     async confirmLogout(): Promise<void> {
    //     const confirmed = await this.alertUtils.confirm(
    //         '¿Cerrar sesión?',
    //         '¿Está seguro de que desea cerrar sesión?',
    //         'Sí, cerrar sesión',
    //         'Cancelar'
    //     );

    //     if (!confirmed) {
    //         return;
    //     }

    //     this.authService.logout();
    //     this.router.navigate(['/auth/login']);
    // }
}
