import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const PATHS: Record<string, string> = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20M10 6h4M10 10h4M10 14h4M10 22v-4h4v4',
  briefcase: 'M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  money: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v12M15 9a3 2 0 0 0-3-1.5c-1.7 0-3 .7-3 2s1.3 1.7 3 2 3 .7 3 2-1.3 2-3 2a3 2 0 0 1-3-1.5',
  card: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2 10h20',
  bank: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M12 3 3 8h18z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v5l3 2',
  shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4',
  trending: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  hash: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
};

@Component({
  selector: 'app-ui-icon',
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="d()" /></svg>`,
  styles: [`:host{display:inline-flex;align-items:center} svg{width:1.1em;height:1.1em}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconoTablaComponent {
  name = input.required<string>();
  d = computed(() => PATHS[this.name()] ?? '');
}