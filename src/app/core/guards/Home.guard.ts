import { Router, type CanMatchFn } from '@angular/router';
import { AuthService } from '../../module/auth/services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const HomeGuard: CanMatchFn = async (route, segments) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.authStatus() === 'authenticated') {
        return true;
    }

    const isAuthenticated = await firstValueFrom(authService.checkStatus());

    if (!isAuthenticated) {
        return router.parseUrl('/auth/login');
    }


    return true;
};
