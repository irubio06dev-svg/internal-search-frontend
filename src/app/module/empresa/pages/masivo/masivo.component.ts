import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MasivasComponent } from '../../components/masivas/masivas.component';

@Component({
  selector: 'app-masivo',
  imports: [MasivasComponent],
  templateUrl: './masivo.component.html',
  styleUrl: './masivo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasivoComponent {

  
}
