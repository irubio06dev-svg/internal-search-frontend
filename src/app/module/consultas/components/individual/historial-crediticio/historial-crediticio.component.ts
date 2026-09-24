import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    input,
    signal,
    viewChild,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Calificacion, Deuda, LineaCredito } from '../../../interfaces/consultas.interface';

@Component({
    selector: 'app-historial-crediticio',
    imports: [DecimalPipe, DatePipe],
    templateUrl: './historial-crediticio.component.html',
})
export class HistorialCrediticioComponent {
    readonly calificaciones = input<Calificacion[]>([]);
    readonly lineasCredito = input<LineaCredito[]>([]);
    readonly deudas = input<Deuda[]>([]);
    readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('report');
    readonly openedAt = signal(new Date());
    readonly selectedPeriod = signal('');

    
    readonly periods = computed(() => {
        const records = [...this.calificaciones(), ...this.deudas(), ...this.lineasCredito()];
        const periods = records.map((item) => item.periodo ?? '');

        return [...new Set(periods)].sort().reverse();
    });
    readonly period = computed(() => this.selectedPeriod() || this.periods()[0] || '');
    readonly ratings = computed(() =>
        this.calificaciones().filter((item) => (item.periodo ?? '') === this.period()),
    );
    readonly debts = computed(() =>
        this.deudas().filter((item) => (item.periodo ?? '') === this.period()),
    );
    readonly credits = computed(() =>
        this.lineasCredito().filter((item) => (item.periodo ?? '') === this.period()),
    );
    readonly total = computed(() => this.debts().reduce((sum, item) => sum + (item.saldo ?? 0), 0));
    readonly identity = computed(() => {
        const person = this.ratings()[0] ?? this.calificaciones()[0];
        const company = this.debts()[0] ?? this.credits()[0];
        const fullName = [person?.priNombre, person?.segNombre, person?.apePat, person?.apeMat]
            .filter(Boolean)
            .join(' ');

        return {
            documento: person?.documento || company?.documento || 'No disponible',
            nombre: fullName || company?.razonSocial || 'No disponible',
        };
    });
    readonly categories = [
        { key: 'nor', label: 'Normal', color: '#2fecad' },
        { key: 'cpp', label: 'Prob. potenciales', color: '#35bc5d' },
        { key: 'def', label: 'Deficiente', color: '#d8c245' },
        { key: 'dud', label: 'Dudoso', color: '#c44a00' },
        { key: 'per', label: 'Pérdida', color: '#dc2626' },
    ] as const;

    constructor() {
        afterNextRender(() => this.open());
    }

    open(): void {
        this.openedAt.set(new Date());
        this.dialog()?.nativeElement.showModal();
    }

    usedPercent(line: LineaCredito): number | null {
        return line.lineaCreditoMonto && line.lineaUtilizada != null
            ? (line.lineaUtilizada / line.lineaCreditoMonto) * 100
            : null;
    }

    unusedPercent(line: LineaCredito): number | null {
        return line.lineaCreditoMonto && line.lineaNoUtilizada != null
            ? (line.lineaNoUtilizada / line.lineaCreditoMonto) * 100
            : null;
    }
}
