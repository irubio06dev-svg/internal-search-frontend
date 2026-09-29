import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home.component";



export const homeRoutes: Routes = [
    {
        path: '',
        component: HomeComponent,
        children: [
            {
                path: 'personas',
                loadChildren: () => import('../consultas/consultas.routes'),
            },

            {
                path: 'empresa',
                loadChildren: () => import('../consultas/consultas.routes'),
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
                redirectTo: 'consultas',
                pathMatch: 'full',
            }
        ]
    },


]
export default homeRoutes;
