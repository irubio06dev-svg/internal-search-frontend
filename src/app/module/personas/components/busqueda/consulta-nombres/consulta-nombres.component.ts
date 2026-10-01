import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-consulta-nombres',
    imports: [ReactiveFormsModule],
    templateUrl: './consulta-nombres.component.html',
    styleUrls: ['../consulta-dni/consulta-dni.component.css', './consulta-nombres.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaNombresComponent {
    readonly nombres = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });
    readonly formulario = new FormGroup({ nombres: this.nombres });
    readonly aviso = signal('');

    buscar(): void {
        this.nombres.setValue(this.nombres.value.trim());
        this.formulario.markAllAsTouched();
        this.aviso.set('');
        if (this.formulario.invalid) return;
        this.aviso.set('La búsqueda por apellidos y nombres todavía no está disponible.');
    }

    limpiar(): void {
        this.formulario.reset();
        this.aviso.set('');
    }
}
