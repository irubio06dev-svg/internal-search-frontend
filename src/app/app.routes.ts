import { Routes } from '@angular/router';
import { HomeGuard } from './core/guards/Home.guard';
import { NotAuthenticatedGuardGuard } from './core/guards/not-authenticated.guard';
import { LoginPageComponent } from './module/auth/pages/login-page/login-page.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginPageComponent,
    },
    // Recuperación de contraseña: públicas y sin NotAuthenticatedGuard, porque el enlace del correo
    // debe abrir aunque haya otra sesión iniciada en el navegador.
    {
        path: 'auth/forgot-password',
        loadComponent: () => import('./module/auth/pages/forgot-password/forgot-password.component')
            .then(m => m.ForgotPasswordComponent),
    },
    {
        path: 'auth/reset-password',
        loadComponent: () => import('./module/auth/pages/reset-password/reset-password.component')
            .then(m => m.ResetPasswordComponent),
    },
    {
        path: 'auth',
        loadChildren: () => import('./module/auth/auth.routes'),
        canMatch: [
            NotAuthenticatedGuardGuard
        ]
    },
    {
        path: 'system',
        loadChildren: () => import('./module/home/home.routes'),
        canMatch: [
            HomeGuard
        ],

    },

    {
        path: '**',
        redirectTo: 'auth/login',
    }
];

