import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { EmpresaResponse } from '../interfaces/empresa-response.interface';

@Injectable({ providedIn: 'root' })
export class EmpresaIndividualService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.baseUrl.replace(/\/$/, '');

    buscarPorRuc(ruc: string) {
        return this.http.get<EmpresaResponse | null>(`${this.baseUrl}/api/empresa/individual/${encodeURIComponent(ruc)}`);
    }
    
    buscarPorRazonSocial(razonSocial: string) {
        return this.http.get<EmpresaResponse | null>(`${this.baseUrl}/api/empresa/razon-social/${encodeURIComponent(razonSocial.trim())}`);
    }
}
