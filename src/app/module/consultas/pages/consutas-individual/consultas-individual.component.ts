import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConsultasService } from '../../services/consultas.service';
import { BuscadorEntrada, BuscadorResponse } from '../../interfaces/consultas.interface';
import { CommonModule } from '@angular/common';
import { SueldosComponent } from '../../components/individual/sueldos/sueldos.component';
import { SunarpComponent } from '../../components/individual/sunarp/sunarp.component';
import { AlertasComponent } from '../../components/individual/alertas/alertas.component';
import { CorreosComponent } from '../../components/individual/correos/correos.component';
import { HistorialCrediticioComponent } from '../../components/individual/historial-crediticio/historial-crediticio.component';
import { SuneduComponent } from '../../components/individual/sunedu/sunedu.component';
import { TelefonoComponent } from '../../components/individual/telefono/telefono.component';
import { ReniecComponent } from '../../components/individual/reniec/reniec.component';

@Component({
    selector: 'app-consultas-individual',
    imports: [ReactiveFormsModule,

        AlertasComponent,
        CorreosComponent,
        HistorialCrediticioComponent,
        SueldosComponent,
        SunarpComponent,
        SuneduComponent,
        TelefonoComponent,
        ReniecComponent,
    ],
    templateUrl: './consultas-individual.component.html',
    styleUrl: './consultas-individual.component.css',
})
export class ConsultasIndividualComponent implements OnInit {
    ngOnInit(): void {
        this.form.get('documento')?.valueChanges.subscribe(valor => {
            this.onDocumentoChange(valor);
        });

    }



    private fb = inject(FormBuilder);
    public consultasService = inject(ConsultasService);
    resultado?: BuscadorResponse;
    activeTab = 'reniec';

    protected readonly tabs = [
        { id: 'reniec', label: 'Reniec' },
        { id: 'telefono', label: 'Teléfono' },
        { id: 'historial-crediticio', label: 'Historial crediticio' },
        { id: 'sueldos', label: 'Sueldos' },
        { id: 'correos', label: 'Correos' },
        { id: 'sunarp', label: 'Sunarp' },
        { id: 'sunat', label: 'Sunat' },
        { id: 'sunedu', label: 'Sunedu' },
        { id: 'alertas', label: 'Alertas' },
    ] as const;

    public arrarDatos = signal<BuscadorResponse | null>(null);

    form: FormGroup = this.fb.group({
        tipoDocumento: ['DNI', Validators.required],
        documento: [''],
        apePat: [''],      // en RUC actúa como "Razón Social"
        apeMat: [''],
        prenombres: [''],
        telefono: ['']
    });



    get tipoDocumento(): string {
        return this.form.get('tipoDocumento')?.value;
    }

    get esDni(): boolean {
        return this.tipoDocumento === 'DNI';
    }

    get esRuc(): boolean {
        return this.tipoDocumento === 'RUC';
    }

    get labelApePat(): string {
        return this.esRuc ? 'Razón social' : 'Apellido paterno';
    }

    get maxLengthDocumento(): number {
        switch (this.tipoDocumento) {
            case 'DNI': return 8;
            case 'RUC': return 11;
            default: return 12; // CE / PASAPORTE
        }
    }
    onDocumentoChange(valor: string): void {
        const camposDatos = ['apePat', 'apeMat', 'prenombres', 'telefono'];

        if (valor && valor.trim().length > 0) {
            // Empezó a escribir -> bloquear los demás
            camposDatos.forEach(campo => this.form.get(campo)?.disable());
        } else {
            // Borró todo el campo -> desbloquear de nuevo
            camposDatos.forEach(campo => this.form.get(campo)?.enable());
        }
    }

    buscar(): void {
        const valores = this.form.value;

        const request: BuscadorEntrada = {
            tipoDocumento: valores.tipoDocumento,
            documento: valores.documento || null,
            apePat: valores.apePat || null,
            apeMat: this.esRuc ? null : (valores.apeMat || null),
            prenombres: this.esRuc ? null : (valores.prenombres || null),
            telefono: this.esRuc ? null : (valores.telefono || null)
        };

        this.consultasService.consultar(request).subscribe({
            next: (response: BuscadorResponse) => {
                this.arrarDatos.set(response)
            },
            error: (err) => console.error('Error en búsqueda:', err)
        });
    }


    selectTab(tab: string): void {
        this.activeTab = tab;
    }

    limpiar(): void {
        this.form.reset({ tipoDocumento: 'DNI' });
        this.resultado = undefined;
    }

    onTipoDocumentoChange(): void {
        const camposDatos = ['apePat', 'apeMat', 'prenombres', 'telefono'];

        // Limpiar valores previos
        this.form.patchValue({
            documento: '',
            apePat: '',
            apeMat: '',
            prenombres: '',
            telefono: ''
        });

        // Bloquear todos los campos de datos, dejar solo "documento" habilitado
        camposDatos.forEach(campo => this.form.get(campo)?.disable());
        this.form.get('documento')?.enable();
    }
}   
