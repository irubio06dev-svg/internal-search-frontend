import { inject } from '@angular/core';
import { Route, Router, UrlSegment, CanMatchFn } from '@angular/router';
import { AuthService } from '../../module/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const NotAuthenticatedGuardGuard: CanMatchFn = async (route: Route, segments: UrlSegment[]) => {
    const authService = inject(AuthService);

    const router = inject(Router);
    if (authService.authStatus() === 'authenticated') {
        return router.parseUrl('/system/dashboard');
    }

    const isAuthenticated = await firstValueFrom(authService.checkStatus());

    if (isAuthenticated) {
        return router.parseUrl('/system/dashboard');
    }

    return true;
};
