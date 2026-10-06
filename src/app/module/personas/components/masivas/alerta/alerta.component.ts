import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TipoMensaje } from '../../../interfaces/consultas-masivas';

/** Mensaje de éxito o error, con botón opcional para reintentar. */
@Component({
    selector: 'app-alerta',
    templateUrl: './alerta.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertaComponent {
    readonly tipo = input<TipoMensaje>(null);
    readonly mensaje = input.required<string>();
    readonly mostrarReintentar = input<boolean>(false);
    readonly reintentar = output<void>();
}
