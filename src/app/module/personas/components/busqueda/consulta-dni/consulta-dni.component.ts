import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    signal
} from '@angular/core';

import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ConsultasService } from '../../../services/consultas.service';

import {
    BuscadorResponse,
    ReniecResponse
} from '../../../interfaces/consultas.interface';

import {
    imagenReniec,
    nombreReniec,
    seccionesReniec
} from '../../../utils/reniec.utils';

import {
    mensajeError
} from '../../../../../shared/utils/http-error.utils';


type Seccion =
    | 'moviles'
    | 'sueldos'
    | 'deudas'
    | 'lineasCredito'
    | 'calificaciones';

type Pestana =
    | 'general'
    | Seccion
    | 'reniec';


@Component({
    selector: 'app-consulta-dni',

    imports: [
        ReactiveFormsModule,
        DatePipe,
        DecimalPipe
    ],

    templateUrl: './consulta-dni.component.html',

    styleUrls: [
        './consulta-dni.component.css',
        './consulta-dni-reniec.css'
    ],

    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaDniComponent {

    private readonly servicio = inject(ConsultasService);
    private readonly destroyRef = inject(DestroyRef);

    readonly esEmpresa =
        inject(ActivatedRoute).snapshot.data['tipoDocumento'] === 'RUC';

    readonly tipoDocumento =
        this.esEmpresa ? 'RUC' : 'DNI';

    readonly longitudDocumento =
        this.esEmpresa ? 11 : 8;


    // =========================================================
    // FORMULARIO
    // =========================================================

    readonly dni = new FormControl(
        '',
        {
            nonNullable: true,

            validators: [
                Validators.required,

                Validators.pattern(
                    new RegExp(
                        `^[0-9]{${this.longitudDocumento}}$`
                    )
                )
            ]
        }
    );


    readonly formulario = new FormGroup({
        dni: this.dni
    });


    // =========================================================
    // ESTADO GENERAL
    // =========================================================

    readonly resultado =
        signal<BuscadorResponse | null>(null);

    readonly cargando =
        signal(false);

    readonly error =
        signal('');

    readonly documentoConsultado =
        signal('');


    // La vista general será la primera pantalla
    readonly seccionActiva =
        signal<Pestana>('general');


    // =========================================================
    // SECCIONES
    // =========================================================

    readonly secciones: {
        id: Seccion;
        titulo: string
    }[] = [

        {
            id: 'moviles',
            titulo: 'Teléfonos'
        },

        {
            id: 'sueldos',
            titulo: 'Información laboral'
        },

        {
            id: 'deudas',
            titulo: 'Deudas'
        },

        {
            id: 'lineasCredito',
            titulo: 'Líneas de crédito'
        },

        {
            id: 'calificaciones',
            titulo: 'Calificaciones'
        }
    ];


    // =========================================================
    // PESTAÑAS
    // =========================================================

    readonly pestanas: {
        id: Pestana;
        titulo: string
    }[] = this.esEmpresa

        ? [
            {
                id: 'general',
                titulo: 'Vista general'
            },

            ...this.secciones
        ]

        : [
            {
                id: 'general',
                titulo: 'Vista general'
            },

            ...this.secciones,

            {
                id: 'reniec',
                titulo: 'RENIEC'
            }
        ];


    // =========================================================
    // RENIEC
    // =========================================================

    readonly reniec =
        signal<ReniecResponse | null>(null);

    readonly reniecCargando =
        signal(false);

    readonly reniecError =
        signal('');


    readonly reniecPersona = computed(() =>
        this.reniec()?.datos?.listaAni?.[0] ?? null
    );


    readonly reniecNombre = computed(() =>
        nombreReniec(
            this.reniecPersona()
        )
    );


    readonly reniecFoto = computed(() =>
        imagenReniec(
            this.reniec()?.datos?.foto
        )
    );


    readonly reniecFirma = computed(() =>
        imagenReniec(
            this.reniec()?.datos?.firma
        )
    );


    readonly reniecSecciones = computed(() =>
        seccionesReniec(
            this.reniecPersona()
        )
    );


    // =========================================================
    // CONTADORES
    // =========================================================

    conteo(
        id: Pestana,
        datos: BuscadorResponse
    ): number | string {

        if (id === 'general') {
            return '';
        }

        if (id === 'reniec') {
            return this.reniecPersona()
                ? 1
                : '—';
        }

        return datos[id]?.length ?? 0;
    }


    // =========================================================
    // CONSULTAR RENIEC
    // =========================================================

    consultarReniec(): void {

        if (
            this.reniecCargando()
            || this.esEmpresa
        ) {
            return;
        }


        this.reniecCargando.set(true);
        this.reniecError.set('');


        this.servicio
            .consultarReniec(
                this.documentoConsultado()
            )

            .pipe(

                takeUntilDestroyed(
                    this.destroyRef
                ),

                finalize(() =>
                    this.reniecCargando.set(false)
                )
            )

            .subscribe({

                next: respuesta => {

                    this.reniec.set(
                        respuesta
                    );
                },

                error: error => {

                    this.reniecError.set(

                        mensajeError(
                            error,
                            'No se pudo consultar RENIEC. Intenta nuevamente.'
                        )
                    );
                }
            });
    }


    // =========================================================
    // NAVEGACIÓN DE PESTAÑAS
    // =========================================================

    navegarTabs(event: KeyboardEvent, indice: number): void {
        let destino: number;

        switch (event.key) {
            case 'ArrowRight':
                destino = (indice + 1) % this.pestanas.length;
                break;

            case 'ArrowLeft':
                destino = (indice - 1 + this.pestanas.length) % this.pestanas.length;
                break;

            case 'Home':
                destino = 0;
                break;

            case 'End':
                destino = this.pestanas.length - 1;
                break;

            default:
                return;
        }

        event.preventDefault();

        this.seccionActiva.set(this.pestanas[destino].id);

        const boton = event.currentTarget as HTMLButtonElement;

        boton.parentElement
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            [destino]
            ?.focus();
    }


    // =========================================================
    // NOMBRE
    // =========================================================

    readonly nombre = computed(() => {

        const interno =
            this.nombreInterno();


        if (
            interno === 'No disponible'
            && this.reniecNombre()
        ) {

            return this.reniecNombre();
        }


        return interno;
    });


    private readonly nombreInterno =
        computed(() => {

            const datos =
                this.resultado();


            if (this.esEmpresa) {

                return datos?.deudas
                    ?.find(
                        deuda =>
                            deuda.razonSocial
                    )
                    ?.razonSocial

                    ||

                    datos?.lineasCredito
                        ?.find(
                            linea =>
                                linea.razonSocial
                        )
                        ?.razonSocial

                    ||

                    'No disponible';
            }


            const persona =
                datos?.calificaciones
                    ?.find(
                        persona =>
                            persona.apePat
                            || persona.apeMat
                            || persona.priNombre
                            || persona.segNombre
                    );


            if (persona) {

                return [
                    persona.apePat,
                    persona.apeMat,
                    persona.priNombre,
                    persona.segNombre
                ]

                    .filter(Boolean)

                    .join(' ');
            }


            const movil =
                datos?.moviles
                    ?.find(
                        persona =>
                            persona.apePat
                            || persona.apeMat
                            || persona.prenombres
                    );


            return movil

                ? [
                    movil.apePat,
                    movil.apeMat,
                    movil.prenombres
                ]

                    .filter(Boolean)

                    .join(' ')

                : datos?.sueldos
                    ?.find(
                        persona =>
                            persona.apeNom
                    )
                    ?.apeNom

                || 'No disponible';
        });


    // =========================================================
    // EXISTENCIA DE DATOS
    // =========================================================

    readonly tieneDatos = computed(() => {

        const resultado =
            this.resultado();


        return !!resultado
            && [

                resultado.deudas,
                resultado.lineasCredito,
                resultado.calificaciones,
                resultado.sueldos,
                resultado.moviles

            ].some(
                lista =>
                    lista?.length
            );
    });


    // =========================================================
    // BUSCAR
    // =========================================================

    buscar(): void {

        if (this.cargando()) {
            return;
        }


        this.dni.setValue(
            this.dni.value.trim()
        );


        this.formulario
            .markAllAsTouched();


        if (this.formulario.invalid) {
            return;
        }


        // Limpiamos búsqueda anterior
        this.error.set('');

        this.resultado.set(null);

        this.reniec.set(null);

        this.reniecError.set('');

        this.documentoConsultado.set(
            this.dni.value
        );

        this.cargando.set(true);


        this.servicio
            .consultar({

                tipoDocumento:
                    this.tipoDocumento,

                documento:
                    this.dni.value
            })

            .pipe(

                takeUntilDestroyed(
                    this.destroyRef
                ),

                finalize(() =>
                    this.cargando.set(false)
                )
            )

            .subscribe({

                next: resultado => {

                    this.resultado.set(
                        resultado
                    );

                    // Siempre abrimos Vista general
                    this.seccionActiva.set(
                        'general'
                    );
                },


                error: () => {

                    this.error.set(
                        'No se pudo realizar la consulta. Intenta nuevamente.'
                    );
                }
            });
    }


    // =========================================================
    // LIMPIAR
    // =========================================================

    limpiar(): void {

        if (this.cargando()) {
            return;
        }


        this.formulario.reset();

        this.resultado.set(null);

        this.reniec.set(null);

        this.reniecError.set('');

        this.error.set('');

        this.documentoConsultado.set('');

        this.seccionActiva.set(
            'general'
        );
    }


    // =========================================================
    // SOLO NÚMEROS
    // =========================================================

    soloNumeros(event: Event): void {
        const input = event.target as HTMLInputElement;

        const valorLimpio = input.value
            .replace(/\D/g, '')
            .slice(0, this.longitudDocumento);

        input.value = valorLimpio;
        this.dni.setValue(valorLimpio);
    }
}