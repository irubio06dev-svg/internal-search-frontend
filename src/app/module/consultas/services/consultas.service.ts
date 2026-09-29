import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { BuscadorEntrada, BuscadorResponse, BuscadorTelefonoResponse } from '../interfaces/consultas.interface';

@Injectable({
    providedIn: 'root' 
})
export class ConsultasService {
    public consultarTelefono(telefono: string): Observable<BuscadorTelefonoResponse> {
        return this.http.post<BuscadorTelefonoResponse>(`${this.baseUrl}/api/buscador/buscar-telefono`, { telefono });
    }
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.baseUrl.replace(/\/$/, '');

    private readonly _resultado = signal<BuscadorResponse | null>(null);
    private readonly _isLoading = signal(false);
    private readonly _error = signal<string | null>(null);

    readonly resultado = this._resultado.asReadonly();
    public isLoading = this._isLoading.asReadonly();
    readonly error = this._error.asReadonly();

    public consultar(entrada: BuscadorEntrada): Observable<BuscadorResponse> {
        this._isLoading.set(true);
        this._error.set(null);
        this._resultado.set(null);

        return this.http.post<BuscadorResponse>(
            `${this.baseUrl}/api/buscador/buscar`,
            entrada,
        ).pipe(
            tap(resultado => this._resultado.set(resultado)),
            catchError((error: HttpErrorResponse) => {
                this._error.set(error.error?.mensaje ?? 'No se pudo realizar la consulta. Intenta nuevamente.');
                return throwError(() => error);
            }),
            finalize(() => this._isLoading.set(false)),
        );
    }
}
