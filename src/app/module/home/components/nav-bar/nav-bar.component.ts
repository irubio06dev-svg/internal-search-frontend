import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { IconsComponent } from '../../../../shared/icons/icons.component';

@Component({
    selector: 'app-nav-bar',
    imports: [IconsComponent],
    templateUrl: './nav-bar.component.html',
    styleUrl: './nav-bar.component.css',
})
export class NavBarComponent {
    readonly authService = inject(AuthService);
    readonly userMenuOpen = signal(false);
    @ViewChild('userMenu') private userMenu?: ElementRef<HTMLElement>;

    @HostListener('document:click', ['$event'])
    closeOnOutsideClick(event: MouseEvent): void {
        if (!this.userMenu?.nativeElement.contains(event.target as Node)) {
            this.userMenuOpen.set(false);
        }
    }

    @HostListener('document:keydown.escape')
    closeOnEscape(): void {
        if (this.userMenuOpen()) {
            this.userMenuOpen.set(false);
            this.userMenu?.nativeElement.querySelector('button')?.focus();
        }
    }


    
}
