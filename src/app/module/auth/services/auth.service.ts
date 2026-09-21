import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { authResponse, UserResponse } from '../interfaces/auth-response.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment.development';
import { User } from '../interfaces/auth.interface copy';


type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private _authStatus = signal<AuthStatus>('checking');
    private _user = signal<UserResponse | null>(null);
    private _token = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

    private http = inject(HttpClient);
    private env = environment.baseUrl;

    checkStatusResource = rxResource({
        defaultValue: false,
        stream: () => this.checkStatus(),
    });

    authStatus = computed<AuthStatus>(() => {
        if (this._authStatus() === 'checking') return 'checking';


        if (this._user()) {
            return 'authenticated';
        }

        return 'not-authenticated';
    });

    user = computed<UserResponse | null>(() => this._user());
    token = computed<string | null>(() => this._token());

    public login(user: User): Observable<authResponse> {
        return this.http.post<authResponse>(`${this.env}system/auth/login`, user).pipe(
            tap((resp) => {
                if (resp.success === 1) {
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

        return this.http.get<authResponse>(`${this.env}system/auth/check-status`, {
            // headers: {
            //     'Authorization': `Bearer ${token}`
            // }
        }).pipe(
            map((resp) => resp.success === 1 && this.handleAuthSuccess(resp)),
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

    private handleAuthSuccess({ data }: authResponse) {
        this._user.set(data.user);
        this._authStatus.set('authenticated');
        this._token.set(data.token);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('cod_role', data.user.cod_role.toString());

        }
        return true;
    }

    private handleAuthError(error: any) {
        this.logout();
        return of(false);
    }
}
