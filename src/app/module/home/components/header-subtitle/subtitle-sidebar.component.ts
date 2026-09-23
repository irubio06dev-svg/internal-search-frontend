import { ChangeDetectionStrategy, Component, input, type OnInit } from '@angular/core';
import { IconsComponent } from '../../../../shared/icons/icons.component';
import { UsuarioResponse } from '../../../auth/interfaces/auth-response.interface';

@Component({
    // IconsComponent
    selector: 'app-subtitle-sidebar',
    imports: [],
    templateUrl: './subtitle-sidebar.component.html',
    styleUrls: ['./subtitle-sidebar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubtitleSidebarComponent {
    public user = input<UsuarioResponse | null>();
}
