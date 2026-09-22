import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { AuthResponse, UsuarioResponse } from '../interfaces/auth-response.interface';
import { environment } from '../../../../environments/environment.development';
import { User } from '../interfaces/auth.interface copy';


type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private _authStatus = signal<AuthStatus>('checking');
    private _user = signal<UsuarioResponse | null>(null);
    private _token = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

    private http = inject(HttpClient);
    private env = environment.baseUrl;

    authStatus = computed<AuthStatus>(() => {
        if (this._authStatus() === 'checking') return 'checking';


        if (this._user()) {
            return 'authenticated';
        }

        return 'not-authenticated';
    });

    user = computed<UsuarioResponse | null>(() => this._user());
    token = computed<string | null>(() => this._token());

    public login(user: User): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.env}system/auth/login`, user).pipe(
            tap((resp) => {
                if (resp.estado === 1) {
                    this.handleAuthSuccess(resp);
                    return;
                }

                this.logout();
            }),
            catchError((err) => {
                this.logout();
                return throwError(() => err);
            })
        );
    }

    public checkStatus(): Observable<boolean> {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

        if (!token) {
            this.logout();
            return of(false);
        }

        return this.http.get<AuthResponse>(`${this.env}system/auth/check-status`, {
            // headers: {
            //     'Authorization': `Bearer ${token}`
            // }
        }).pipe(
            map((resp) => {
                if (resp.estado === 1) return this.handleAuthSuccess(resp);
                this.logout();
                return false;
            }),
            catchError((err) => this.handleAuthError(err))
        );
    }

    public logout(): void {
        this._token.set(null);
        this._user.set(null);
        this._authStatus.set('not-authenticated');
        if (typeof localStorage !== 'undefined') {

            localStorage.removeItem('token');
            localStorage.removeItem('cod_role');

        }


    }

    private handleAuthSuccess({ ...data }: AuthResponse) {
        this._user.set(data.usuario);
        this._authStatus.set('authenticated');
        this._token.set(data.token);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('cod_role', data.usuario.id.toString());

        }
        return true;
    }

    private handleAuthError(error: any) {
        this.logout();
        return of(false);
    }
}
