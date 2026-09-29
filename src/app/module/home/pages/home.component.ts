import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { HomeService } from '../service/home.service';
import { ResponseRoute } from '../interfaces/home.interface';
import { LogoutComponent } from '../components/logout/logout.component';
import { SidebarmenuComponent } from '../../../shared/sidebarmenu/sidebarmenu.component';
import { GlobalLoaderComponent } from '../../../shared/global-loader/global-loader.component';
import { LoadingService } from '../../../core/services/loading.service';
import { HeaderSidebarComponent } from '../components/header-sidebar/header-sidebar.component';
import { SubtitleSidebarComponent } from '../components/header-subtitle/subtitle-sidebar.component';

@Component({
    selector: 'app-home',
    imports: [
        SidebarmenuComponent,
        HeaderSidebarComponent,
        SubtitleSidebarComponent,
        NavBarComponent,
        RouterOutlet,
        GlobalLoaderComponent,
        LogoutComponent
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
    public authService = inject(AuthService);
    private homeService = inject(HomeService);
    public loadingService = inject(LoadingService);
    public items = signal<ResponseRoute[]>([]);

    ngOnInit(): void {
        this.getRoutes();

    }


    public getRoutes(): void {
        const user = this.authService.user();

        console.log('USUARIO:', user);
        console.log('ID USUARIO:', user?.id);
        console.log('ROLES:', user?.roles);

        const codRole = user?.id;

        if (!codRole) {
            console.warn('No existe codRole');
            return;
        }

        this.homeService.getRoutes(codRole).subscribe({
            next: (resp) => {

                console.log('RESPUESTA BACKEND:', resp);

                const tree = this.buildRouteTree(resp);

                console.log('ÁRBOL FINAL:', tree);

                this.items.set(tree);
            },

            error: (err) => {
                console.error('ERROR RUTAS:', err);
            }
        });
    }

    private buildRouteTree(routes: ResponseRoute[]): ResponseRoute[] {
        const map = new Map<number, ResponseRoute>();
        const tree: ResponseRoute[] = [];

        // 1. Crear todos los nodos
        const collect = (nodes: ResponseRoute[], parentId: number | null = null): void => {
            nodes.forEach(route => {
                map.set(route.codMenu, {
                    ...route,
                    codMenuPadre: route.codMenuPadre ?? parentId,
                    children: []
                });
                if (route.children?.length) collect(route.children, route.codMenu);
            });
        };
        collect(routes);

        // 2. Relacionar hijos con sus padres
        map.forEach(node => {

            const parent =
                node.codMenuPadre === null
                    ? undefined
                    : map.get(node.codMenuPadre);

            if (parent) {
                parent.children!.push(node);
            } else {
                tree.push(node);
            }

        });

        // 3. Preparar menú y rutas
        const prepareMenu = (
            nodes: ResponseRoute[],
            parentPath = ''
        ): ResponseRoute[] => {

            return nodes
                .filter(node => node.puedeVer === 1)
                .sort((a, b) => a.orden - b.orden)
                .map(node => {

                    const path = node.ruta.trim();

                    const ruta = (
                        path.startsWith('/') || path.startsWith('system/') || path === parentPath || (parentPath && path.startsWith(`${parentPath}/`))
                            ? path
                            : `${parentPath}/${path}`
                    )
                        .split('/')
                        .filter(Boolean)
                        .join('/');

                    // Aquí se construyen automáticamente
                    // las subrutas que vienen de BD
                    const children = prepareMenu(
                        node.children ?? [],
                        ruta
                    );

                    return {
                        ...node,
                        ruta,
                        children
                    };
                });
        };

        return prepareMenu(tree);

    }
}







