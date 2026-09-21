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
        const fullPath = this.items()?.full_path ?? this.items()?.route_path ?? '';
        const segments = fullPath
            .split('/')
            .map((segment) => segment.trim())
            .filter(Boolean);

        return ['/system', ...segments];
    });
}
