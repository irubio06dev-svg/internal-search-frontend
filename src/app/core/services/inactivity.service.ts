import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../module/auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class InactivityService {

    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly ngZone = inject(NgZone);

    private timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 10 minutos
    private readonly inactivityTime = 20 * 1000;
    
    private readonly events = [
        'click',
        'mousemove',
        'keydown',
        'scroll',
        'touchstart'
    ];

    start(): void {
        this.events.forEach(event => {
            window.addEventListener(event, this.resetTimer);
        });

        this.resetTimer();
    }

    stop(): void {
        this.events.forEach(event => {
            window.removeEventListener(event, this.resetTimer);
        });

        this.clearTimer();
    }

    private resetTimer = (): void => {

        if (this.authService.authStatus() !== 'authenticated') {
            return;
        }

        this.clearTimer();

        this.ngZone.runOutsideAngular(() => {
            this.timeoutId = setTimeout(() => {

                this.ngZone.run(() => {
                    this.logoutByInactivity();
                });

            }, this.inactivityTime);
        });
    };

    private clearTimer(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    private logoutByInactivity(): void {

        this.stop();

        this.authService.logout();

        this.router.navigate(['/auth/login']);
    }
}