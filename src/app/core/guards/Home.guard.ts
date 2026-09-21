import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../../module/auth/services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const HomeGuard: CanMatchFn = async (route, segments) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Espera a que checkStatus() resuelva por completo (incluyendo
    // handleAuthSuccess, que llena _user con cod_role) antes de
    // dejar pasar. Así el componente protegido nunca se monta con
    // el signal _user todavía en null.
    const isAuthenticated = await firstValueFrom(authService.checkStatus());

    if (!isAuthenticated) {
        router.navigateByUrl('/auth/login'); // ajusta a tu ruta real de login
        return false;
    }


    return true;
};
