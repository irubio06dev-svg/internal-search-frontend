import { Injectable, computed, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
    private readonly pendingRequests = signal(0);
    readonly isLoading = computed(() => this.pendingRequests() > 0);

    public show(): void {
        this.pendingRequests.update((requests) => requests + 1);
    }

    public hide(): void {
        this.pendingRequests.update((requests) => Math.max(0, requests - 1));
    }
}
