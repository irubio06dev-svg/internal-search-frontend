import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ModoEntrada = 'pegar' | 'archivo';

/** Pestañas para elegir entre pegar documentos o subir un archivo. */
@Component({
    selector: 'app-selector-modo',
    templateUrl: './selector-modo.component.html',
    styleUrl: './selector-modo.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorModoComponent {
    readonly modo = input.required<ModoEntrada>();
    readonly deshabilitado = input<boolean>(false);
    readonly cambiar = output<ModoEntrada>();

}
