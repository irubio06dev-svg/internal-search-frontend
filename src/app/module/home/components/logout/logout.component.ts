import { ChangeDetectionStrategy, Component, inject, input, type OnInit } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AlertUtils } from '../../../../shared/utils/alerts.utils';
import { LoadingService } from '../../../../core/services/loading.service';
import { IconsComponent } from '../../../../shared/icons/icons.component';

@Component({
    selector: 'app-logout',
    imports: [IconsComponent],
    templateUrl: './logout.component.html',
    styleUrl: './logout.component.css',
})
export class LogoutComponent {
    public authService = inject(AuthService);
    public router = inject(Router);
    public loadingService = inject(LoadingService);

    public alertUtils = AlertUtils;

    async confirmLogout(): Promise<void> {
        const confirmed = await this.alertUtils.confirm(
            '¿Cerrar sesión?',
            '¿Está seguro de que desea cerrar sesión?',
            'Sí, cerrar sesión',
            'Cancelar',
            'corporate'
        );

        if (!confirmed) {
            return;
        }

        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
