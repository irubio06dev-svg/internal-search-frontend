import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
    {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    },
    {
        path: 'auditoria',
        loadComponent: () => import('./pages/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
    },
    { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
];

export default adminRoutes;
