import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconsComponent } from '../icons/icons.component';
import { ResponseRoute } from '../../module/home/interfaces/home.interface';

@Component({
    selector: 'app-sidebarmenu',
    imports: [RouterLink, RouterLinkActive, IconsComponent],
    templateUrl: './sidebarmenu.component.html',
    styleUrl: './sidebarmenu.component.css',
})
export class SidebarmenuComponent {
    items = input.required<ResponseRoute>();
    level = input<number>(0);

    routeSegments = computed(() => {
        const fullPath = this.items().ruta;
        const segments = fullPath
            .split('/')
            .map((segment) => segment.trim())
            .filter(Boolean);

        if (segments[0] === 'system') {
            segments.shift();
        }

        // Los nombres anteriores apuntan al mismo módulo y mantienen el estado activo del menú.

        return ['/system', ...segments];
    });
}
