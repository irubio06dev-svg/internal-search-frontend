import { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home.component";
import { DasboardComponent } from "../dasboard/dasboard.component";



export const homeRoutes: Routes = [
    {
        path: '',
        component: HomeComponent,
        children: [
            {
                path: 'dashboard',
                component: DasboardComponent,
            },

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
            // {
            //     path: 'history',
            //     component: HistoricComponent,
            // },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full',
            }
        ]
    },


]
export default homeRoutes;
