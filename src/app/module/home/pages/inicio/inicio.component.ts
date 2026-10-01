import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ConsultasMasivasService } from '../../../personas/services/consultas-masiva.service';
import { HistorialDescarga } from '../../../personas/interfaces/historial.interface';

@Component({
    selector: 'app-inicio',
    imports: [RouterLink],
    templateUrl: './inicio.component.html',
    styleUrl: './inicio.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit {
    readonly auth = inject(AuthService);
    private readonly servicio = inject(ConsultasMasivasService);
    private readonly destroyRef = inject(DestroyRef);
    readonly historial = signal<HistorialDescarga[]>([]);
    readonly cargando = signal(false);
    readonly error = signal('');
    readonly errorDescarga = signal('');
    readonly descargando = signal<number | null>(null);

    ngOnInit(): void { this.cargar(); }

    cargar(): void {
        const usuario = this.auth.user();
        if (this.cargando()) return;
        if (!usuario) { this.error.set('No se pudo identificar al usuario.'); return; }
        this.error.set('');
        this.cargando.set(true);
        this.servicio.obtenerHistorial(usuario.id)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.cargando.set(false)))
            .subscribe({
                next: registros => this.historial.set([...registros].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).slice(0, 5)),
                error: () => this.error.set('No pudimos cargar tus descargas recientes.'),
            });
    }

    descargar(item: HistorialDescarga): void {
        if (this.descargando() !== null) return;
        this.errorDescarga.set('');
        this.descargando.set(item.id);
        this.servicio.descargarHistorial(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.descargando.set(null)))
            .subscribe({
                next: archivo => this.servicio.descargarBlob(archivo, item.archivo),
                error: () => this.errorDescarga.set('No pudimos descargar el archivo. Intenta nuevamente.'),
            });
    }
}
