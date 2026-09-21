import { Routes } from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";

export const authRoutes: Routes = [
    {

        path: '',
        component: LoginPageComponent,
        children: [
            {
                path: 'login',
                component: LoginPageComponent
            },

            // {
            //     path: 'register',
            //     component: RegisterPageComponent
            // },
            {
                path: '**',
                redirectTo: 'login'
            }
        ]
    }

]
export default authRoutes;
