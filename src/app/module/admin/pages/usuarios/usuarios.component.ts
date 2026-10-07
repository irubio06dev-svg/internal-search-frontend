import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROL_ADMIN_GENERAL } from '../../../../core/constants/roles';
import { AlertUtils } from '../../../../shared/utils/alerts.utils';
import { fechaUtc, mensajeError } from '../../../../shared/utils/http-error.utils';
import { AuthService } from '../../../auth/services/auth.service';
import { RolListado, TokenMovimiento, UsuarioListado } from '../../interfaces/admin.interface';
import { AdminService } from '../../services/admin.service';

type Modal = 'crear' | 'roles' | 'tokens' | null;

@Component({
    selector: 'app-usuarios',
    imports: [ReactiveFormsModule, DatePipe],
    templateUrl: './usuarios.component.html',
    styleUrls: ['../admin-pages.css', './usuarios.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosComponent implements OnInit {
    private readonly admin = inject(AdminService);
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);

    readonly tamano = 25;
    readonly fechaUtc = fechaUtc;

    readonly usuarios = signal<UsuarioListado[]>([]);
    readonly roles = signal<RolListado[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(1);
    readonly texto = signal('');
    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);
    readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamano)));

    readonly modal = signal<Modal>(null);
    readonly seleccionado = signal<UsuarioListado | null>(null);
    readonly guardando = signal(false);
    readonly errorModal = signal<string | null>(null);
    readonly rolesSeleccionados = signal<number[]>([]);
    readonly movimientos = signal<TokenMovimiento[]>([]);
    readonly modoTokens = signal<'asignar' | 'retirar'>('asignar');

    readonly miId = computed(() => this.auth.user()?.id);

    readonly crearForm = this.fb.nonNullable.group({
        nombres: ['', [Validators.required, Validators.maxLength(100)]],
        apePat: ['', [Validators.required, Validators.maxLength(100)]],
        apeMat: [''],
        usuarioLogin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
        correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        dni: [''],
        telefono: [''],
        tokensIniciales: [0, [Validators.min(0), Validators.max(1_000_000)]],
        clave: [''],
    });

    readonly tokensForm = this.fb.nonNullable.group({
        cantidad: [1, [Validators.required, Validators.min(1), Validators.max(1_000_000)]],
        motivo: ['', [Validators.required, Validators.maxLength(250)]],
    });

    // El rol ADMIN GENERAL no usa saldo: es ilimitado
    readonly rolesElegidosIncluyenAdmin = computed(() => this.incluyeAdmin(this.rolesSeleccionados()));

    ngOnInit(): void {
        this.admin.listarRoles().subscribe({
            next: r => this.roles.set(r),
            error: e => this.error.set(mensajeError(e, 'No se pudieron cargar los roles.')),
        });
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.error.set(null);

        this.admin.listarUsuarios(this.texto(), this.pagina(), this.tamano).subscribe({
            next: p => {
                this.usuarios.set(p.items);
                this.total.set(p.total);
                this.cargando.set(false);
            },
            error: e => {
                this.error.set(mensajeError(e, 'No se pudieron cargar los usuarios.'));
                this.cargando.set(false);
            },
        });
    }

    buscar(valor: string): void {
        this.texto.set(valor);
        this.pagina.set(1);
        this.cargar();
    }

    irA(pagina: number): void {
        if (pagina < 1 || pagina > this.totalPaginas()) return;
        this.pagina.set(pagina);
        this.cargar();
    }

    esIlimitado(u: UsuarioListado): boolean {
        return u.roles.some(r => r.toUpperCase() === ROL_ADMIN_GENERAL);
    }

    // ---------- Modales ----------

    abrirCrear(): void {
        this.crearForm.reset({ tokensIniciales: 0 });
        this.rolesSeleccionados.set([]);
        this.errorModal.set(null);
        this.modal.set('crear');
    }

    abrirRoles(u: UsuarioListado): void {
        this.seleccionado.set(u);
        const codigos = this.roles()
            .filter(r => u.roles.some(n => n.toUpperCase() === r.rol.toUpperCase()))
            .map(r => r.codigoRol);
        this.rolesSeleccionados.set(codigos);
        this.errorModal.set(null);
        this.modal.set('roles');
    }

    abrirTokens(u: UsuarioListado): void {
        this.seleccionado.set(u);
        this.tokensForm.reset({ cantidad: 1, motivo: '' });
        this.modoTokens.set('asignar');
        this.errorModal.set(null);
        this.movimientos.set([]);
        this.modal.set('tokens');

        if (!this.esIlimitado(u)) {
            this.admin.movimientos(u.id).subscribe({
                next: m => this.movimientos.set(m),
                error: e => this.errorModal.set(mensajeError(e)),
            });
        }
    }

    cerrar(): void {
        if (this.guardando()) return;
        this.modal.set(null);
        this.seleccionado.set(null);
    }

    toggleRol(codigo: number): void {
        this.rolesSeleccionados.update(actual =>
            actual.includes(codigo) ? actual.filter(c => c !== codigo) : [...actual, codigo],
        );
    }

    private incluyeAdmin(codigos: number[]): boolean {
        return this.roles().some(r => codigos.includes(r.codigoRol) && r.rol.toUpperCase() === ROL_ADMIN_GENERAL);
    }

    // ---------- Acciones ----------

    crear(): void {
        if (this.crearForm.invalid || this.rolesSeleccionados().length === 0) {
            this.crearForm.markAllAsTouched();
            this.errorModal.set(this.rolesSeleccionados().length === 0 ? 'Selecciona al menos un rol.' : null);
            return;
        }

        const v = this.crearForm.getRawValue();
        this.guardando.set(true);
        this.errorModal.set(null);

        this.admin.crearUsuario({
            nombres: v.nombres.trim(),
            apePat: v.apePat.trim(),
            apeMat: v.apeMat.trim() || null,
            usuarioLogin: v.usuarioLogin.trim(),
            correo: v.correo.trim(),
            dni: v.dni.trim() || null,
            telefono: v.telefono.trim() || null,
            codRoles: this.rolesSeleccionados(),
            tokensIniciales: this.rolesElegidosIncluyenAdmin() ? 0 : v.tokensIniciales,
            clave: v.clave || null,
        }).subscribe({
            next: r => {
                this.guardando.set(false);
                this.modal.set(null);
                this.cargar();

                const aviso = v.clave
                    ? 'La cuenta quedó activa con la contraseña indicada.'
                    : r.invitacionEnviada
                        ? 'Enviamos un correo para que defina su contraseña.'
                        : 'La cuenta se creó, pero no se pudo enviar el correo de invitación. El usuario puede usar "Olvidé mi contraseña".';
                AlertUtils.success(`Usuario ${r.usuarioLogin} creado`, aviso);
            },
            error: e => {
                this.guardando.set(false);
                this.errorModal.set(mensajeError(e));
            },
        });
    }

    guardarRoles(): void {
        const u = this.seleccionado();
        if (!u) return;

        if (this.rolesSeleccionados().length === 0) {
            this.errorModal.set('Selecciona al menos un rol.');
            return;
        }

        this.guardando.set(true);
        this.errorModal.set(null);

        this.admin.cambiarRoles(u.id, this.rolesSeleccionados()).subscribe({
            next: () => {
                this.guardando.set(false);
                this.modal.set(null);
                this.cargar();
            },
            error: e => {
                this.guardando.set(false);
                this.errorModal.set(mensajeError(e));
            },
        });
    }

    guardarTokens(): void {
        const u = this.seleccionado();
        if (!u) return;

        if (this.tokensForm.invalid) {
            this.tokensForm.markAllAsTouched();
            return;
        }

        const v = this.tokensForm.getRawValue();
        const cantidad = this.modoTokens() === 'asignar' ? v.cantidad : -v.cantidad;

        this.guardando.set(true);
        this.errorModal.set(null);

        this.admin.asignarTokens({ codUsuario: u.id, cantidad, motivo: v.motivo.trim() }).subscribe({
            next: saldo => {
                this.guardando.set(false);
                this.modal.set(null);
                this.cargar();
                AlertUtils.success('Tokens actualizados', `Nuevo saldo de ${u.usuario}: ${saldo.saldo}.`);
            },
            error: e => {
                this.guardando.set(false);
                this.errorModal.set(mensajeError(e));
            },
        });
    }

    async cerrarSesiones(u: UsuarioListado): Promise<void> {
        const ok = await AlertUtils.confirm(
            '¿Cerrar sesiones?',
            `${u.usuario} tendrá que volver a iniciar sesión en todos sus equipos.`,
            'Sí, cerrar sesiones',
            'Cancelar',
        );
        if (!ok) return;

        this.admin.cerrarSesiones(u.id).subscribe({
            next: () => AlertUtils.success('Sesiones cerradas', `${u.usuario} deberá iniciar sesión nuevamente.`),
            error: e => AlertUtils.error('No se pudieron cerrar las sesiones', mensajeError(e)),
        });
    }

    async cambiarEstado(u: UsuarioListado): Promise<void> {
        const activar = u.estado !== 1;
        const ok = await AlertUtils.confirm(
            activar ? '¿Activar usuario?' : '¿Desactivar usuario?',
            activar
                ? `${u.usuario} podrá iniciar sesión nuevamente.`
                : `${u.usuario} perderá el acceso de inmediato.`,
            activar ? 'Sí, activar' : 'Sí, desactivar',
            'Cancelar',
        );
        if (!ok) return;

        this.admin.cambiarEstado(u.id, activar).subscribe({
            next: () => this.cargar(),
            error: e => AlertUtils.error('No se pudo cambiar el estado', mensajeError(e)),
        });
    }
}
