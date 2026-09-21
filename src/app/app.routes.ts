import { Routes } from '@angular/router';
import { LoginPageComponent } from './module/auth/pages/login-page/login-page.component';
import { HomeGuard } from './core/guards/Home.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginPageComponent,
    },
    {
        path: 'auth',
        loadChildren: () => import('./module/auth/auth.routes'),
        // canMatch: [
        //     NotAuthenticatedGuardGuard
        // ]
    },
    {
        path: 'system',
        loadChildren: () => import('./module/home/home.routes')
        // canMatch: [
        //     HomeGuard
        // ],

    },

    {
        path: '**',
        redirectTo: 'auth/login',
    }


];
