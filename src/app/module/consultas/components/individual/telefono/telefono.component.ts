import { ChangeDetectionStrategy, Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';
import { Movil } from '../../../interfaces/consultas.interface';
import { DatePipe } from '@angular/common';
const NOT_AVAILABLE = 'No disponible';
@Component({
    selector: 'app-telefono',
    templateUrl: './telefono.component.html',
    imports: [DatePipe],

    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelefonoComponent {
    readonly moviles = input<Movil[]>([]);
 
    private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('phones');
 
    protected readonly openedAt = signal(new Date());
 
    /** Documento y nombre salen del primer registro (son los mismos para todos los teléfonos). */
    protected readonly identity = computed(() => {
        const first = this.moviles()[0];
        const fullName = [first?.prenombres, first?.apePat, first?.apeMat]
            .filter(Boolean)
            .join(' ');
 
        return {
            documento: first?.documento || NOT_AVAILABLE,
            nombre: fullName || NOT_AVAILABLE,
        };
    });
 
    open(): void {
        this.openedAt.set(new Date());
        this.dialog()?.nativeElement.showModal();
    }
}
