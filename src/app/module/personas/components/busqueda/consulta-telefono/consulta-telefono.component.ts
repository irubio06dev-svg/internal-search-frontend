import { RecordCarouselComponent, RecordSlideDirective } from '../../../../../shared/record-carousel.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ConsultasService } from '../../../services/consultas.service';
import { BuscadorTelefonoResponse } from '../../../interfaces/consultas.interface';

@Component({
    selector: 'app-consulta-telefono',
    imports: [RecordCarouselComponent, RecordSlideDirective, ReactiveFormsModule, DatePipe
    ],
    templateUrl: './consulta-telefono.component.html',
    styleUrls: ['../consulta-dni/consulta-dni.component.css', './consulta-telefono.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaTelefonoComponent {
    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);
    readonly telefono = new FormControl('', {
        nonNullable: true,
        validators: [
            Validators.required,
            Validators.pattern(/^9[0-9]{8}$/)
        ]
    });
    readonly formulario = new FormGroup({ telefono: this.telefono });
    readonly resultado = signal<BuscadorTelefonoResponse | null>(null);
    readonly cargando = signal(false);
    readonly error = signal('');
    texto(valor: string | null | undefined, alternativo = 'No disponible'): string {
        const limpio = valor?.trim();
        return !limpio || limpio.toUpperCase() === 'NULL' ? alternativo : limpio;
    }

    buscar(): void {

        if (this.cargando()) return;

        this.formulario.markAllAsTouched();

        if (this.formulario.invalid) return;

        this.resultado.set(null);
        this.error.set('');
        this.cargando.set(true);

        this.servicio.consultarTelefono(this.telefono.value)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false))
            )
            .subscribe({
                next: datos => this.resultado.set(datos),
                error: () => this.error.set(
                    'No se pudo realizar la consulta. Intenta nuevamente.'
                )
            });
    }

    limpiar(): void {
        if (this.cargando()) return;
        this.formulario.reset();
        this.resultado.set(null);
        this.error.set('');
    }

    limitarTelefono(event: Event): void {
        const input = event.target as HTMLInputElement;

        const digitos = input.value.replace(/[^0-9]/g, '').slice(0, 9);
        input.value = digitos;
        this.telefono.setValue(digitos);
    }
}
