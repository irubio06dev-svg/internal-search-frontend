import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SaldoTokens } from '../../module/admin/interfaces/admin.interface';

// Saldo de tokens (consultas) del usuario en sesión
@Injectable({ providedIn: 'root' })
export class TokensService {
    private readonly http = inject(HttpClient);
    private readonly base = environment.baseUrl.replace(/\/$/, '');
    private readonly _saldo = signal<SaldoTokens | null>(null);

    readonly saldo = this._saldo.asReadonly();

    refresh() {
        return this.http.get<SaldoTokens>(`${this.base}/system/tokens/mi-saldo`).pipe(
            tap(s => this._saldo.set(s)),
            catchError(() => of(null)),
        );
    }

    clear(): void {
        this._saldo.set(null);
    }
}
