import { Component, input } from '@angular/core';

@Component({
    selector: 'app-global-loader',
    imports: [],
	
    templateUrl: './global-loader.component.html',
    styleUrl: './global-loader.component.css',
})
export class GlobalLoaderComponent {

	public selectLoader = input<string>('');
	

}
