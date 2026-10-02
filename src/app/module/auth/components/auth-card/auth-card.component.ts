import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Contenedor común de las pantallas de recuperación de contraseña.
// Manual de marca: logo completo a color sobre fondo blanco, corte curvo azul con filete rojo
// (el rojo solo como acento) y tratamiento de "tú".
@Component({
    selector: 'app-auth-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="ip-font relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10">
            <section class="relative z-10 w-full max-w-md rounded-xl border border-[var(--blue-25)] bg-white px-7 pb-8 pt-7 shadow-sm"
                aria-labelledby="auth-card-title">
                <img src="/images/image.png" alt="Informa Perú" class="mx-auto mb-6 block h-14 w-auto object-contain" />
                <h1 id="auth-card-title" class="ip-title text-center text-2xl">{{ titulo() }}</h1>
                @if (subtitulo()) {
                    <p class="mt-2 text-center text-sm text-[var(--text-muted)]">{{ subtitulo() }}</p>
                }
                <div class="mt-6"><ng-content /></div>
            </section>

            <!-- Corte curvo azul con filete rojo -->
            <svg class="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 1440 160"
                preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 60 C 360 130 1080 0 1440 70 L1440 160 L0 160 Z" fill="var(--brand-blue)" />
                <path d="M0 60 C 360 130 1080 0 1440 70" fill="none" stroke="var(--brand-red)" stroke-width="4" />
            </svg>
        </main>
    `,
})
export class AuthCardComponent {
    titulo = input.required<string>();
    subtitulo = input<string>('');
}
