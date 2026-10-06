import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Encabezado de página. El ícono se pasa como contenido con el atributo `icono`:
 * <app-page-header titulo="..."><svg icono ...></svg></app-page-header>
 */
@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
    readonly ruta = input<string>('');
    readonly titulo = input.required<string>();
    readonly descripcion = input<string>('');
}
