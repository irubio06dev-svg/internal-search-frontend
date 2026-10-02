import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { AuthService } from '../../module/auth/services/auth.service';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { AlertUtils } from '../../shared/utils/alerts.utils';
import { Router } from '@angular/router';
import { TokensService } from '../services/tokens.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const authService = inject(AuthService);
    const loadingService = inject(LoadingService);
    const tokensService = inject(TokensService);
    const token = authService.token();
    const alertUtils = AlertUtils;
    const router = inject(Router);

    // Sin sesión (login, recuperación de contraseña) no se envía "Bearer null"
    const newReq = token
        ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
        : req;

    loadingService.show();
    // Las consultas descuentan tokens: tras una respuesta correcta se actualiza el saldo de la barra
    const descuentaTokens = /\/api\/(buscador|empresa)\//.test(req.url);

    return next(newReq).pipe(
        tap(event => {
            if (descuentaTokens && event instanceof HttpResponse) {
                tokensService.refresh().subscribe();
            }
        }),
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401 && authService.authStatus() === 'authenticated') {
                authService.logout();
                alertUtils.sessionExpired().then((result) => {
                    if (result) {
                        router.navigate(['/auth/login']);
                    }
                });
            } else if (err.status === 402) {
                // El backend descuenta un token por consulta; sin saldo responde 402
                alertUtils.sinTokens(err.error?.saldo, err.error?.costo);
                tokensService.refresh().subscribe();
            } else if (err.status === 403) {
                alertUtils.error('Sin permiso', 'Tu rol no permite realizar esta acción.');
            } else if (err.status === 429) {
                alertUtils.error('Demasiados intentos', 'Espera un minuto antes de volver a intentarlo.');
            }
            return throwError(() => err);
        }),
        finalize(() => loadingService.hide()),
    );
}
