import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
// import { ConsultasService } from '../../services/consultas.service';
// import { BuscadorEntrada, BuscadorResponse } from '../../interfaces/consultas.interface';
import { CommonModule, DecimalPipe } from '@angular/common';

import { documentoValidator, getDocumentoErrorMessage, LONGITUDES_POR_TIPO } from '../../../../shared/utils/validators';
import Swal from 'sweetalert2';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';


type Grupo = 'documento' | 'telefono' | 'nombres' | null;

@Component({
    selector: 'app-consultas-individual',
    imports: [RouterLink, RouterLinkActive, RouterOutlet

    ],
    templateUrl: './empresa-individual.component.html',
    styleUrl: './empresa-individual.component.css',
})
export class EmpresaIndividualComponent {



    // private readonly fb = inject(FormBuilder);
    // private readonly consultaService = inject(ConsultasService);

    // resultado = signal<BuscadorResponse | null>(null);

    // error: string | null = null;
    // isLoading = false;

    // formulario: FormGroup = this.fb.group({
    //     documento: ['DNI', Validators.required],
    //     tipoDocumento: [''],
    // });

    // public buscar(): void {

    //     if (this.formulario.invalid) {
    //         this.formulario.markAllAsTouched();
    //         return;
    //     }

    //     this.isLoading = true;
    //     this.error = null;
    //     this.resultado.set(null);

    //     this.consultaService.consultar(this.formulario.getRawValue()).subscribe({

    //         next: (response: BuscadorResponse) => {
    //             console.log(response);
    //             this.resultado.set(response);
    //             this.isLoading = false;
    //         },

    //         error: (error) => {
    //             console.error('Error al realizar la consulta:', error);

    //             this.error =
    //                 error?.error?.message ??
    //                 'Ocurrió un error al realizar la consulta.';

    //             this.isLoading = false;
    //         },

    //         complete: () => {
    //             this.isLoading = false;
    //         }

    //     });
    // }

    // public limpiar(): void {
    //     this.formulario.reset({
    //         tipoDocumento: 'DNI',
    //         documento: ''
    //     });

    //     this.resultado.set(null);
    //     this.error = null;
    // }

}   
