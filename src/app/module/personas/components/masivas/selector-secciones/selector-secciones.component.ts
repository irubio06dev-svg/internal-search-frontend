import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CardHeadingComponent } from '../card-heading/card-heading.component';

export interface OpcionSeccion { id: string; nombre: string; detalle: string; }

/** Tarjeta "Información a incluir": checkboxes de secciones + seleccionar/desmarcar todas. */
@Component({
    selector: 'app-selector-secciones',
    imports: [CardHeadingComponent],
    templateUrl: './selector-secciones.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorSeccionesComponent {
    readonly opciones = input.required<OpcionSeccion[]>();
    readonly seleccionadas = input.required<string[]>();
    readonly deshabilitado = input<boolean>(false);

    readonly cambiarSeccion = output<{ id: string; marcado: boolean }>();
    readonly seleccionarTodas = output<boolean>();

    readonly todasSeleccionadas = computed(() => this.seleccionadas().length === this.opciones().length);

    onCambio(id: string, event: Event): void {
        this.cambiarSeccion.emit({ id, marcado: (event.target as HTMLInputElement).checked });
    }
}
