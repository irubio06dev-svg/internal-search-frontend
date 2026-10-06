import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RecordCarouselComponent, RecordSlideDirective } from './record-carousel.component';

@Component({
    imports: [RecordCarouselComponent, RecordSlideDirective],
    template: `<app-record-carousel [records]="records()">@for (record of records(); track $index) { <dl appRecordSlide><dt>Registro</dt><dd>{{ record }}</dd></dl> } @empty { <p>Sin registros</p> }</app-record-carousel>`,
})
class HostComponent {
    readonly records = signal([1, 2, 3, 4, 5, 6]);
}

describe('Record carousel', () => {
    it('shows one record, navigates with buttons and keyboard, and resets on new results', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement;
        const visible = () => Array.from(root.querySelectorAll('dl')).filter(el => el.style.display !== 'none');
        expect(visible().length).toBe(1);
        const buttons = root.querySelectorAll('button');
        expect(buttons[0].disabled).toBe(true);
        buttons[1].click();
        await fixture.whenStable();
        expect(visible()[0].textContent).toContain('2');
        const viewport = root.querySelector('.viewport')!;
        for (let i = 0; i < 8; i++) {
            viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            await fixture.whenStable();
        }
        expect(visible()[0].textContent).toContain('6');
        expect(buttons[1].disabled).toBe(true);
        fixture.componentInstance.records.set([10, 20]);
        await fixture.whenStable();
        expect(visible()[0].textContent).toContain('10');
        expect(root.textContent).toContain('Registro 1 de 2');
        fixture.componentInstance.records.set([]);
        await fixture.whenStable();
        expect(root.querySelector('nav')).toBeNull();
        expect(root.textContent).toContain('Sin registros');
    });

    it('accepts horizontal swipes and ignores vertical gestures', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const viewport: HTMLElement = fixture.nativeElement.querySelector('.viewport');
        const touch = (type: string, x: number, y: number) => {
            const event = new Event(type);
            Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', { value: [{ clientX: x, clientY: y }] });
            viewport.dispatchEvent(event);
        };
        touch('touchstart', 200, 10);
        touch('touchend', 100, 15);
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('Registro 2 de 6');
        touch('touchstart', 200, 10);
        touch('touchend', 180, 200);
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('Registro 2 de 6');
    });
});
