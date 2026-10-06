import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FileSizePipePipe } from '../../../../../core/pipes/FileSizePipe-pipe.pipe';

/** Tarjeta con el archivo elegido: nombre, tamaño, líneas detectadas y botón para quitarlo. */
@Component({
    selector: 'app-archivo-seleccionado',
    imports: [FileSizePipePipe],
    templateUrl: './archivo-seleccionado.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivoSeleccionadoComponent {
    readonly archivo = input.required<File>();
    readonly lineas = input<number | null>(null);
    readonly deshabilitado = input<boolean>(false);
    readonly quitar = output<void>();

    readonly extension = computed(() => this.archivo().name.split('.').pop()?.toUpperCase() ?? '');
}
