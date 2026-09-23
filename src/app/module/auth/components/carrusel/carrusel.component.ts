import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal, type OnInit } from '@angular/core';
import { CARRUSEL_SLIDES } from '../../interfaces/auth.interface';

@Component({
    selector: 'app-carrusel',
    imports: [],
    templateUrl: './carrusel.component.html',
    styleUrl: './carrusel.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarruselComponent {
    private destroyRef = inject(DestroyRef);
    activeSlide = signal(0);
    readonly slides = [...CARRUSEL_SLIDES];

    constructor() {
        afterNextRender(() => {
            const carouselTimer = setInterval(() => this.nextSlide(), 5000);
            this.destroyRef.onDestroy(() => clearInterval(carouselTimer));
        });
    }

    public previousSlide(): void {
        this.activeSlide.update((slide) => (slide - 1 + this.slides.length) % this.slides.length);
    }

    public nextSlide(): void {
        this.activeSlide.update((slide) => (slide + 1) % this.slides.length);
    }

    public goToSlide(index: number): void {
        this.activeSlide.set(index);
    }
}
