import { Component, computed, inject, input } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { IconsComponent } from '../icons/icons.component';
import { ICONS } from '../interfaces/icons.intefaces';
import { ResponseRoute } from '../../module/home/interfaces/home.interface';

@Component({
    selector: 'app-sidebarmenu',
    imports: [RouterLink, RouterLinkActive, IconsComponent],
    templateUrl: './sidebarmenu.component.html',
    styleUrl: './sidebarmenu.component.css',
})
export class SidebarmenuComponent {
    private router = inject(Router);
    private readonly navigation = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd)));

    items = input.required<ResponseRoute>();
    level = input<number>(0);
    readonly menuIcon = computed(() => {
        const item = this.items();
        const name = item.nomMenu.toLowerCase();
        const route = (item.ruta ?? '').toLowerCase();
        if (/masiv/.test(name + route)) return 'documents';
        if (/individual/.test(name + route)) return 'search';
        if (/empresa/.test(name + route)) return 'building';
        if (/persona/.test(name + route)) return 'userSideBar';
        return item.icono && ICONS[item.icono] ? item.icono : 'search';
    });

    routeSegments = computed(() => {
        const segments = (this.items().ruta?.trim() ?? '')
            .split('/')
            .map(s => s.trim())
            .filter(Boolean);

        return segments[0] === 'system'
            ? ['/', ...segments]
            : ['/system', ...segments];
    });

    // Abre el grupo si algún descendiente coincide con la URL actual
    isActive = computed(() => {
        this.navigation();
        const check = (m: ResponseRoute): boolean =>
            (m.children ?? []).some(c => {
                const clean = (c.ruta ?? '').trim().replace(/^\/+/, '');
                const url = clean.startsWith('system') ? `/${clean}` : `/system/${clean}`;
                return this.router.isActive(url, {
                    paths: 'subset',
                    queryParams: 'ignored',
                    fragment: 'ignored',
                    matrixParams: 'ignored',
                }) || check(c);
            });
        return check(this.items());
    });
}
