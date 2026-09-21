import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ResponseRoute } from '../interfaces/home.interface';
import { catchError, finalize, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
    providedIn: 'root',
})
export class HomeService {
    private http = inject(HttpClient);
    private env = environment.baseUrl;


    // Estado centralizado de las rutas del menú
    private _routes = signal<ResponseRoute[]>([]);
    private _isLoading = signal<boolean>(false);
    private _error = signal<string | null>(null);

    routes = this._routes.asReadonly();
    isLoading = this._isLoading.asReadonly();
    error = this._error.asReadonly();

    public getRoutes(cod_role: number) {
        this._isLoading.set(true);
        this._error.set(null);

        return this.http
            .get<ResponseRoute[]>(`${this.env}system/home/get-routes`, {
                params: { cod_role: cod_role },
            })
            .pipe(
                tap((routes) => this._routes.set(routes)),
                catchError((err) => {
                    this._error.set('No se pudieron cargar las rutas del menú');
                    this._routes.set([]);
                    console.error('Error al obtener rutas:', err);
                    return of([]);
                }),
                finalize(() => this._isLoading.set(false))
            );
    }

    clearRoutes() {
        this._routes.set([]);
    }

}
