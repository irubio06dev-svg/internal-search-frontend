import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Barra de progreso del procesamiento, con mensaje y botón para cancelar. */
@Component({
    selector: 'app-progreso-carga',
    templateUrl: './progreso-carga.component.html',
    styleUrl: './progreso-carga.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgresoCargaComponent {
    readonly progreso = input<number>(0);
    readonly progresoDisponible = input<boolean>(false);
    readonly mensaje = input<string>('');
    readonly cancelar = output<void>();
}
