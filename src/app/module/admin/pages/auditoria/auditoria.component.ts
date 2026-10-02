import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { fechaUtc, mensajeError } from '../../../../shared/utils/http-error.utils';
import { AuditoriaRegistro } from '../../interfaces/admin.interface';
import { AdminService } from '../../services/admin.service';

// Acciones que registra el backend (ver AuditoriaService / TokenService)
export const ACCIONES_AUDITORIA = [
    'LOGIN',
    'LOGIN_FALLIDO',
    'BUSQUEDA_PERSONA',
    'BUSQUEDA_TELEFONO',
    'BUSQUEDA_EMPRESA_RUC',
    'BUSQUEDA_EMPRESA_RAZON',
    'BUSQUEDA_MASIVA',
    'USUARIO_CREADO',
    'USUARIO_ACTIVADO',
    'USUARIO_DESACTIVADO',
    'USUARIO_ROLES',
    'TOKENS_AJUSTE',
    'CLAVE_RECUPERACION_SOLICITADA',
    'CLAVE_RESTABLECIDA',
    'CLAVE_RESTABLECER_FALLIDO',
];

@Component({
    selector: 'app-auditoria',
    imports: [ReactiveFormsModule, DatePipe],
    templateUrl: './auditoria.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaComponent implements OnInit {
    private readonly admin = inject(AdminService);
    private readonly fb = inject(FormBuilder);

    readonly acciones = ACCIONES_AUDITORIA;
    readonly tamano = 50;
    readonly fechaUtc = fechaUtc;

    readonly registros = signal<AuditoriaRegistro[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(1);
    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);
    readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamano)));

    readonly filtros = this.fb.nonNullable.group({
        desde: [''],
        hasta: [''],
        usuario: [''],
        accion: [''],
    });

    ngOnInit(): void {
        this.cargar();
    }

    aplicar(): void {
        this.pagina.set(1);
        this.cargar();
    }

    limpiar(): void {
        this.filtros.reset();
        this.aplicar();
    }

    irA(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginas()) return;
        this.pagina.set(pagina);
        this.cargar();
    }

    cargar(): void {
        const f = this.filtros.getRawValue();
        this.cargando.set(true);
        this.error.set(null);

        this.admin.auditoria({
            desde: this.inicioDiaUtc(f.desde),
            hasta: this.finDiaUtc(f.hasta),
            usuario: f.usuario,
            accion: f.accion,
            pagina: this.pagina(),
            tamano: this.tamano,
        }).subscribe({
            next: p => {
                this.registros.set(p.items);
                this.total.set(p.total);
                this.cargando.set(false);
            },
            error: e => {
                this.error.set(mensajeError(e, 'No se pudo cargar la auditoría.'));
                this.cargando.set(false);
            },
        });
    }

    // La fecha elegida es del día local; la base guarda UTC. Se envía como UTC sin "Z"
    // porque el backend interpretaría la "Z" como hora local del servidor.
    private inicioDiaUtc(fecha: string): string | undefined {
        return fecha ? new Date(`${fecha}T00:00:00`).toISOString().slice(0, 19) : undefined;
    }

    private finDiaUtc(fecha: string): string | undefined {
        return fecha ? new Date(`${fecha}T23:59:59`).toISOString().slice(0, 19) : undefined;
    }
}
