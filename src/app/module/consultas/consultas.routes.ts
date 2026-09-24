import { Routes } from '@angular/router';
import { ConsultaMasivaComponent } from './pages/consulta-masiva/consulta-masiva.component';
import { ConsultasIndividualComponent } from './pages/consutas-individual/consultas-individual.component';

export const consultasRoutes: Routes = [
    { path: 'individual', component: ConsultasIndividualComponent },
    { path: 'masiva', component: ConsultaMasivaComponent },
    { path: '', redirectTo: 'individual', pathMatch: 'full' },
];

export default consultasRoutes;
