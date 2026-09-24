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


    public getRoutes() {
        const user = this.authService.user();
        const codRole = user?.id;

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
            map.set(route.codMenu, { ...route, children: [] });
        });

        map.forEach(node => {
            const parent = node.codMenuPadre === null ? undefined : map.get(node.codMenuPadre);
            if (parent) {
                parent.children!.push(node);
            } else {
                tree.push(node);
            }
        });

        // Resolver las rutas después de construir el árbol permite recibir hijos antes que padres.
        const prepareMenu = (nodes: ResponseRoute[], parentPath = ''): ResponseRoute[] =>
            nodes
                .filter(node => node.puedeVer === 1)
                .sort((a, b) => a.orden - b.orden)
                .map(node => {
                    const path = node.ruta.trim();
                    const ruta = (path.startsWith('/') ? path : `${parentPath}/${path}`)
                        .split('/').filter(Boolean).join('/');

                    let children = prepareMenu(node.children ?? [], ruta);
                    // Si el backend solo entrega Consultas, agregar sus dos pantallas al menú.
                    if ((ruta === 'consultas' || ruta === 'system/consultas') && !node.children?.length) {
                        children = [
                            { ...node, codMenu: -1, codMenuPadre: node.codMenu, nomMenu: 'Individual', ruta: `${ruta}/individual`, orden: 1, children: [] },
                            { ...node, codMenu: -2, codMenuPadre: node.codMenu, nomMenu: 'Masiva', ruta: `${ruta}/masiva`, orden: 2, children: [] },
                        ];
                    }
                    return { ...node, ruta, children };
                });

        return prepareMenu(tree);
    }

}








