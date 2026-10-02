export interface PaginaDto<T> {
    items: T[];
    total: number;
    pagina: number;
    tamano: number;
}

export interface UsuarioListado {
    id: number;
    usuario: string;
    nombreCompleto: string;
    correo: string | null;
    estado: number;
    roles: string[];
    saldoTokens: number;
}

export interface RolListado {
    codigoRol: number;
    rol: string;
    descripcion: string | null;
}

export interface CrearUsuarioRequest {
    nombres: string;
    apePat: string;
    apeMat?: string | null;
    usuarioLogin: string;
    correo: string;
    dni?: string | null;
    telefono?: string | null;
    codRoles: number[];
    tokensIniciales: number;
    clave?: string | null;
}

export interface CrearUsuarioResponse {
    codUsuario: number;
    usuarioLogin: string;
    invitacionEnviada: boolean;
}

export interface SaldoTokens {
    codUsuario: number;
    ilimitado: boolean;
    saldo: number;
}

export interface AsignarTokensRequest {
    codUsuario: number;
    // Positivo asigna, negativo retira
    cantidad: number;
    motivo: string;
}

export interface TokenMovimiento {
    codMovimiento: number;
    codUsuario: number;
    tipo: number;
    cantidad: number;
    saldoResultante: number;
    accion: string;
    detalle: string | null;
    codUsuarioAccion: number | null;
    fecha: string;
}

export interface AuditoriaRegistro {
    codAuditoria: number;
    fecha: string;
    codUsuario: number | null;
    usuario: string;
    accion: string;
    entidad: string | null;
    entidadId: string | null;
    detalle: string | null;
    ip: string | null;
    exito: boolean;
}

export interface AuditoriaFiltro {
    desde?: string;
    hasta?: string;
    usuario?: string;
    accion?: string;
    pagina: number;
    tamano: number;
}
