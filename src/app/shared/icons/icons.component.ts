import { ChangeDetectionStrategy, Component, computed, Input, input, isDevMode, type OnInit } from '@angular/core';
import { ICONS } from '../interfaces/icons.intefaces';

@Component({
    selector: 'app-icons',
    imports: [],
    templateUrl: './icons.component.html',
})
export class IconsComponent {
    name = input.required<keyof typeof ICONS>();
    klass = input<string>('');
    strokeWidth = input<number>();

    path = computed(() => {
        const p = ICONS[this.name()];

        if (!p && isDevMode()) {
            console.warn(`Icono "${this.name()}" no existe en ICONS`);

        }
        return p ?? ICONS['default'] ?? '';
    });
}
