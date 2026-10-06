import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

import { CardHeadingComponent } from '../card-heading/card-heading.component';
import { FileSizePipePipe } from '../../../../../core/pipes/FileSizePipe-pipe.pipe';
import { HistorialDescarga } from '../../../interfaces/historial.interface';

/** Tarjeta "Historial de descargas": carga, error, tabla y estado vacío. */
@Component({
    selector: 'app-historial-descargas',
    imports: [DatePipe, FileSizePipePipe, CardHeadingComponent],
    templateUrl: './historial-descargas.component.html',
    styleUrl: './historial-descargas.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialDescargasComponent {
    readonly items = input.required<HistorialDescarga[]>();
    readonly cargando = input<boolean>(false);
    readonly error = input<string>('');
    readonly descargandoId = input<number | null>(null);

    readonly reintentar = output<void>();
    readonly descargar = output<HistorialDescarga>();
}
