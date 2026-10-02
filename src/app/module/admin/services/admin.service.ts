import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    AsignarTokensRequest,
    AuditoriaFiltro,
    AuditoriaRegistro,
    CrearUsuarioRequest,
    CrearUsuarioResponse,
    PaginaDto,
    RolListado,
    SaldoTokens,
    TokenMovimiento,
    UsuarioListado,
} from '../interfaces/admin.interface';

// Endpoints reservados a ADMIN GENERAL (el backend los valida de nuevo en cada llamada)
@Injectable({ providedIn: 'root' })
export class AdminService {
    private readonly http = inject(HttpClient);
    private readonly base = environment.baseUrl.replace(/\/$/, '');

    listarUsuarios(texto: string, pagina: number, tamano: number): Observable<PaginaDto<UsuarioListado>> {
        let params = new HttpParams().set('pagina', pagina).set('tamano', tamano);
        if (texto.trim()) params = params.set('texto', texto.trim());
        return this.http.get<PaginaDto<UsuarioListado>>(`${this.base}/system/usuarios`, { params });
    }

    listarRoles(): Observable<RolListado[]> {
        return this.http.get<RolListado[]>(`${this.base}/system/usuarios/roles`);
    }

    crearUsuario(body: CrearUsuarioRequest): Observable<CrearUsuarioResponse> {
        return this.http.post<CrearUsuarioResponse>(`${this.base}/system/usuarios`, body);
    }

    cambiarEstado(codUsuario: number, activo: boolean): Observable<void> {
        return this.http.put<void>(`${this.base}/system/usuarios/${codUsuario}/estado`, { activo });
    }

    cambiarRoles(codUsuario: number, codRoles: number[]): Observable<void> {
        return this.http.put<void>(`${this.base}/system/usuarios/${codUsuario}/roles`, { codRoles });
    }

    asignarTokens(body: AsignarTokensRequest): Observable<SaldoTokens> {
        return this.http.post<SaldoTokens>(`${this.base}/system/tokens/asignar`, body);
    }

    movimientos(codUsuario: number, top = 30): Observable<TokenMovimiento[]> {
        const params = new HttpParams().set('top', top);
        return this.http.get<TokenMovimiento[]>(`${this.base}/system/tokens/${codUsuario}/movimientos`, { params });
    }

    auditoria(filtro: AuditoriaFiltro): Observable<PaginaDto<AuditoriaRegistro>> {
        let params = new HttpParams().set('pagina', filtro.pagina).set('tamano', filtro.tamano);
        if (filtro.desde) params = params.set('desde', filtro.desde);
        if (filtro.hasta) params = params.set('hasta', filtro.hasta);
        if (filtro.usuario?.trim()) params = params.set('usuario', filtro.usuario.trim());
        if (filtro.accion) params = params.set('accion', filtro.accion);
        return this.http.get<PaginaDto<AuditoriaRegistro>>(`${this.base}/system/auditoria`, { params });
    }
}
