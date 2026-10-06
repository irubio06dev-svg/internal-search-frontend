import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Cabecera de tarjeta: ícono + título + descripción, y acciones opcionales a la derecha.
 * <app-card-heading titulo="..." descripcion="...">
 *     <svg icono ...></svg>
 *     <button>Acción</button>   <!-- opcional, se muestra a la derecha -->
 * </app-card-heading>
 */
@Component({
    selector: 'app-card-heading',
    templateUrl: './card-heading.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeadingComponent {
    readonly titulo = input.required<string>();
    readonly descripcion = input<string>('');
    readonly tituloId = input<string>('');
    readonly tono = input<'navy' | 'green'>('navy');

    readonly claseIcono = computed(() =>
        this.tono() === 'green'
            ? 'bg-green-50 text-green-700'
            : 'bg-[var(--navy-soft)] text-[var(--navy)]');
}
