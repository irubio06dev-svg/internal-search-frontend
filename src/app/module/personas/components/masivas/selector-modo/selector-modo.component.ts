import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

export type ModoEntrada = 'pegar' | 'archivo';

/** Pestañas para elegir entre pegar documentos o subir un archivo. */
@Component({
    selector: 'app-selector-modo',
    imports: [NgClass],
    templateUrl: './selector-modo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorModoComponent {
    readonly modo = input.required<ModoEntrada>();
    readonly deshabilitado = input<boolean>(false);
    readonly cambiar = output<ModoEntrada>();

    readonly claseActiva = 'bg-[var(--surface)] text-[var(--navy)] shadow-sm';
    readonly claseInactiva = 'text-[var(--text-muted)] hover:text-[var(--text)]';
}
