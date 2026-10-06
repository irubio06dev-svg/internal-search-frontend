import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DragDropDirective } from '../../../directives/drap-drop.directive';

/** Zona para arrastrar o seleccionar un archivo. Emite siempre una lista de archivos. */
@Component({
    selector: 'app-file-dropzone',
    imports: [DragDropDirective],
    templateUrl: './file-dropzone.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileDropzoneComponent {
    readonly accept = input<string>('.txt,.csv');
    readonly deshabilitado = input<boolean>(false);
    readonly archivos = output<File[]>();

    onDrop(files: FileList): void {
        if (!this.deshabilitado()) this.archivos.emit(Array.from(files));
    }

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        input.value = '';
        if (files.length) this.archivos.emit(files);
    }
}
