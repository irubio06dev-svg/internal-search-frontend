import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sunedu',
  imports: [],
  template: `<p>sunedu works!</p>`,
  styleUrl: './sunedu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuneduComponent {}
