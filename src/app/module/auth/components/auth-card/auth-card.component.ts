import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Contenedor común de las pantallas de recuperación de contraseña (manual de marca Informa Perú)
@Component({
    selector: 'app-auth-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="ip-font flex min-h-screen items-center justify-center bg-[#E8ECF3] px-4 py-10">
            <section class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-sm" [attr.aria-labelledby]="'auth-card-title'">
                <div class="bg-[#1B4589] px-7 py-5 text-lg font-bold text-white">Informa Perú</div>
                <div class="h-1 bg-[#ED1C24]"></div>
                <div class="px-7 pb-8 pt-7">
                    <h1 id="auth-card-title" class="ip-title text-2xl">{{ titulo() }}</h1>
                    @if (subtitulo()) {
                        <p class="mt-2 text-sm text-slate-600">{{ subtitulo() }}</p>
                    }
                    <div class="mt-6"><ng-content /></div>
                </div>
            </section>
        </main>
    `,
})
export class AuthCardComponent {
    titulo = input.required<string>();
    subtitulo = input<string>('');
}
