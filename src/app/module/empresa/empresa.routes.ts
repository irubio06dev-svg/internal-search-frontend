import { Routes } from '@angular/router';
import { MasivoComponent } from './pages/masivo/masivo.component';
import { EmpresaIndividualComponent } from './pages/individual/empresa-individual.component';

export const empresaRoutes: Routes = [

    {
        path: 'individual',
        component: EmpresaIndividualComponent,
        children: [
            { path: 'ruc', loadComponent: () => import('./components/individual/ruc/ruc.component').then(m => m.RucComponent) },
            { path: 'razon-social', loadComponent: () => import('./components/individual/razon-social/razon-social.component').then(m => m.RazonSocialComponent) },
            { path: '', redirectTo: 'ruc', pathMatch: 'full' },

        ],
    },

    {
        path: 'masiva',
        component: MasivoComponent,
    }
];

export default empresaRoutes;
