export interface AuthResponse {
    token: string;
    tipoToken: string;
    expira: number;
    estado: number;
    usuario: UsuarioResponse;
}

export interface UsuarioResponse {
    id: number;
    usuario: string;
    nombreCompleto: string;
    roles: RolResponse[];
}

export interface RolResponse {
    codigoRol: number;
    rol: string;
}