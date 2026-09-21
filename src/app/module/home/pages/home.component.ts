import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { HeaderSidebarComponent } from '../components/header-sidebar/header-sidebar.component';
import { SubtitleSidebarComponent } from '../components/header-subtitle/subtitle-sidebar.component';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { HomeService } from '../service/home.service';
import { ResponseRoute } from '../interfaces/home.interface';
import { LogoutComponent } from '../components/logout/logout.component';
import { SidebarmenuComponent } from '../../../shared/sidebarmenu/sidebarmenu.component';
import { GlobalLoaderComponent } from '../../../shared/global-loader/global-loader.component';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
    selector: 'app-home',
    imports: [
        // HeaderSidebarComponent, 
        // SubtitleSidebarComponent, 
        SidebarmenuComponent,
        NavBarComponent,
        RouterOutlet,
        GlobalLoaderComponent,
        // RouterLinkWithHref,
        LogoutComponent
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
    public authService = inject(AuthService);
    private homeService = inject(HomeService);
    public loadingService = inject(LoadingService);
    public items = signal<ResponseRoute[]>([

        {
            cod_route: 1,
            route_name: 'Inicio',
            route_path: 'dashboard',
            icon_name: 'dasboard',
        },
        {
            cod_route: 2,
            route_name: 'Listas negativas',
            route_path: 'listas-negativas',
            icon_name: 'report',
        },
        {
            cod_route: 3,
            route_name: 'Matriz de riesgos',
            route_path: 'matriz-riesgos',
            icon_name: 'danger',
        },
        {
            cod_route: 4,
            route_name: 'Registro de operaciones',
            route_path: 'operaciones',
            icon_name: 'historic',
        },
        {
            cod_route: 5,
            route_name: 'Usuarios',
            route_path: 'usuarios',
            icon_name: 'userSideBar',
        },
        {
            cod_route: 6,
            route_name: 'Configuración',
            route_path: 'configuracion',
            icon_name: 'config',
        },

    ])

    ngOnInit(): void {
        this.getRoutes();

    }


    public getRoutes() {
        const user = this.authService.user();
        const codRole = user?.cod_role;

        if (!codRole) {
            return;
        }

        this.homeService.getRoutes(codRole).subscribe({
            next: (resp) => {
                const tree = this.buildRouteTree(resp);
                this.items.set(tree);
            },
            error: (err) => {
                console.error('Error al obtener las rutas', err);
            },
        });
    }

    private buildRouteTree(routes: ResponseRoute[]): ResponseRoute[] {
        const map = new Map<number, ResponseRoute>();
        const tree: ResponseRoute[] = [];

        routes.forEach(route => {
            map.set(route.cod_route, { ...route, children: [] });
        });

        routes.forEach(route => {
            const node = map.get(route.cod_route)!;

            if (route.cod_route_parent === null) {
                node.full_path = node.route_path; // raíz: el path completo es el propio
                tree.push(node);
            } else {
                const parent = map.get(route.cod_route_parent!);

                if (parent) {
                    // el path completo del hijo = path completo del padre + el propio segmento
                    node.full_path = `${parent.full_path}/${node.route_path}`;

                    parent.children!.push(node);
                } else {
                    node.full_path = node.route_path;
                    tree.push(node);
                }
            }
        });

        return tree;
    }

}








