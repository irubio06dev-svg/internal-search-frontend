import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../module/auth/services/auth.service';
import { ROL_ADMIN_GENERAL } from '../constants/roles';

// Solo ADMIN GENERAL entra a /system/admin. Es una comodidad de navegación:
// la seguridad real la aplica el backend en cada endpoint.
export const adminGuard: CanMatchFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const esAdmin = authService.user()?.roles?.some(r => r.rol?.toUpperCase() === ROL_ADMIN_GENERAL);

    return esAdmin ? true : router.parseUrl('/system');
};
