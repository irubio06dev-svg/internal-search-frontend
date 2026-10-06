import { ChangeDetectionStrategy, Component, Directive, computed, contentChildren, effect, input, signal } from '@angular/core';

@Directive({
    selector: '[appRecordSlide]',
    host: {
        '[style.display]': 'visible() ? null : "none"',
        '[attr.aria-hidden]': '!visible()',
        '[style.counter-set]': '"registro " + position()',
        '[attr.inert]': 'visible() ? null : ""',
    },
})
export class RecordSlideDirective {
    readonly visible = signal(true);
    readonly position = signal(1);
}

@Component({
    selector: 'app-record-carousel',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (slides().length > 1) {
            <nav aria-label="Navegación de registros">
                <button type="button" aria-label="Registro anterior" [disabled]="current() === 0" (click)="move(-1)">←</button>
                <span aria-live="polite" aria-atomic="true">Registro {{ current() + 1 }} de {{ slides().length }}</span>
                <button type="button" aria-label="Registro siguiente" [disabled]="current() === slides().length - 1" (click)="move(1)">→</button>
            </nav>
        }
        <div class="viewport" [attr.tabindex]="slides().length > 1 ? 0 : null"
            role="group" aria-label="Registros" aria-roledescription="carrusel"
            (keydown)="onKey($event)" (touchstart)="startTouch($event)" (touchend)="endTouch($event)" (touchcancel)="touch = null">
            <ng-content />
        </div>
    `,
    styles: `
        :host { display: block; min-width: 0; }
        nav { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-bottom: 14px; color: var(--text); }
        span { font-size: .8125rem; font-variant-numeric: tabular-nums; }
        button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface); color: var(--navy); font-size: 1.25rem; cursor: pointer; }
        button:hover:not(:disabled) { background: var(--blue-10); }
        button:disabled { opacity: .4; cursor: default; }
        button:focus-visible, .viewport:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }
        .viewport { min-width: 0; border-radius: 10px; }
        @media (max-width: 480px) { nav { justify-content: space-between; } }
    `,
})
export class RecordCarouselComponent {
    readonly records = input<unknown>();
    readonly slides = contentChildren(RecordSlideDirective);
    readonly index = signal(0);
    readonly current = computed(() => Math.min(this.index(), Math.max(0, this.slides().length - 1)));
    touch: { x: number; y: number } | null = null;

    constructor() {
        effect(() => { this.records(); this.index.set(0); });
        effect(() => {
            const current = this.current();
            this.slides().forEach((slide, i) => {
                slide.position.set(i + 1);
                slide.visible.set(i === current);
            });
        });
    }

    move(delta: number) {
        this.index.set(Math.max(0, Math.min(this.slides().length - 1, this.current() + delta)));
    }

    onKey(event: KeyboardEvent) {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            this.move(event.key === 'ArrowRight' ? 1 : -1);
        }
    }

    startTouch(event: TouchEvent) {
        this.touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }

    endTouch(event: TouchEvent) {
        if (!this.touch || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - this.touch.x;
        const dy = event.changedTouches[0].clientY - this.touch.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.move(dx < 0 ? 1 : -1);
        this.touch = null;
    }
}
