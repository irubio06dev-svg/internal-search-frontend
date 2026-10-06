import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { AnalisisDocumentos } from '../../../../../shared/utils/analizar-documentos';

/** Campo para pegar documentos de forma masiva, con resumen y errores. */
@Component({
    selector: 'app-pegar-documentos',
    imports: [NgClass, DecimalPipe],
    templateUrl: './pegar-documentos.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PegarDocumentosComponent {
    readonly placeholder = input('Pega aquí los documentos, uno por línea o separados por comas.\n\n45879632\n20512345678\n001234567');
    readonly texto = input.required<string>();
    readonly analisis = input.required<AnalisisDocumentos>();
    readonly limite = input.required<number>();
    readonly excedeLimite = input<boolean>(false);
    readonly tiposAceptados = input<string>('');
    readonly deshabilitado = input<boolean>(false);

    readonly textoChange = output<string>();
    readonly quitarInvalidos = output<void>();
    readonly limpiar = output<void>();

    onInput(event: Event): void {
        this.textoChange.emit((event.target as HTMLTextAreaElement).value);
    }
}
