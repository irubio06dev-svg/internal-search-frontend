import { ChangeDetectionStrategy, Component, input, type OnInit } from '@angular/core';
import { UserResponse } from '../../../auth/interfaces/auth-response.interface';
import { IconsComponent } from '../../../../shared/icons/icons.component';

@Component({
    selector: 'app-subtitle-sidebar',
    imports: [IconsComponent],
    templateUrl: './subtitle-sidebar.component.html',
    styleUrls: ['./subtitle-sidebar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubtitleSidebarComponent {
    public user = input<UserResponse | null>();
}
