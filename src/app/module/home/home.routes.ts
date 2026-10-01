import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home.component";



export const homeRoutes: Routes = [
    {
        path: '',
        component: HomeComponent,
        children: [
            {
                path: 'personas',
                loadChildren: () => import('../personas/consultas.routes'),
            },

            {
                path: 'empresas',
                loadChildren: () => import('../empresa/empresa.routes'),
            },

            // {
            //     path: 'dasboard',
            //     redirectTo: 'dashboard',
            //     pathMatch: 'full',
            // },

            // {
            //     path: 'prediction',
            //     children: [
            //         {
            //             path: 'new',
            //             component: PredictionComponent,  // <-- vuelve a agregar esto
            //             children: [
            //                 { path: 'type', component: StadisticComponent },
            //                 { path: 'anty', component: StadisticComponent },
            //             ]
            //         },
            //         { path: 'result', component: PatientComponent }
            //     ]
            // },

            {
                path: '',
                loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent),
                pathMatch: 'full',
            }
        ]
    },


]
export default homeRoutes;
