import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appDragDrop]',
      standalone: true

})
export class DrapDropDirective {

    @Output() filesDropped = new EventEmitter<FileList>();
    @Output() dragStateChange = new EventEmitter<boolean>();

    @HostBinding('class.dragover') isDragOver = false;

    @HostListener('dragenter', ['$event'])
    @HostListener('dragover', ['$event'])
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.setDragState(true);
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.setDragState(false);
    }

    @HostListener('drop', ['$event'])
    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.setDragState(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.filesDropped.emit(files);
        }
    }

    private setDragState(state: boolean): void {
        this.isDragOver = state;
        this.dragStateChange.emit(state);
    }


}
