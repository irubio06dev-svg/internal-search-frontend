import { Routes } from '@angular/router';
import { ConsultasIndividualComponent } from './pages/consutas-individual/consultas-individual.component';
import { ConsultasMasivasComponent } from './pages/consultas-masivas/consultas-masivas.component';

export const consultasRoutes: Routes = [
    {
        path: 'individual',
        component: ConsultasIndividualComponent,
        children: [
            { path: 'dni', loadComponent: () => import('./components/busqueda/consulta-dni/consulta-dni.component').then(m => m.ConsultaDniComponent) },
            { path: 'apellidos-nombres', loadComponent: () => import('./components/busqueda/consulta-nombres/consulta-nombres.component').then(m => m.ConsultaNombresComponent) },
            { path: 'telefono', loadComponent: () => import('./components/busqueda/consulta-telefono/consulta-telefono.component').then(m => m.ConsultaTelefonoComponent) },
            { path: '', redirectTo: 'dni', pathMatch: 'full' },
        ],
    },
    { path: 'masivas', component: ConsultasMasivasComponent },
];

export default consultasRoutes;
