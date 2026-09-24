import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, defer, finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { BuscadorEntrada, BuscadorResponse } from '../interfaces/consultas.interface';

@Injectable({
    providedIn: 'root' 
})
export class ConsultasService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.baseUrl.replace(/\/$/, '');
    private readonly _resultado = signal<BuscadorResponse | null>(null);
    private readonly _pendingRequests = signal(0);
    private readonly _error = signal<string | null>(null);
    private latestRequest = 0;

    readonly resultado = this._resultado.asReadonly();
    readonly isLoading = computed(() => this._pendingRequests() > 0);
    readonly error = this._error.asReadonly();

    public consultar(entrada: BuscadorEntrada): Observable<BuscadorResponse> {
        return defer(() => {
            const requestId = ++this.latestRequest;
            this._pendingRequests.update(count => count + 1);
            this._error.set(null);
            this._resultado.set(null);

            return this.http.post<BuscadorResponse>(
                `${this.baseUrl}/system/buscador/buscar`,
                entrada,
            ).pipe(
                tap(resultado => {
                    if (requestId === this.latestRequest) this._resultado.set(resultado);
                }),
                catchError((error: unknown) => {
                    if (requestId === this.latestRequest) {
                        this._resultado.set(null);
                        this._error.set('No se pudo realizar la consulta. Intenta nuevamente.');
                    }
                    return throwError(() => error);
                }),
                finalize(() => this._pendingRequests.update(count => Math.max(0, count - 1))),
            );
        });
    }
}
