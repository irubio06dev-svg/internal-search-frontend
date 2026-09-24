import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sueldos',
  imports: [],
  template: `<p>sueldos works!</p>`,
  styleUrl: './sueldos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SueldosComponent {}
