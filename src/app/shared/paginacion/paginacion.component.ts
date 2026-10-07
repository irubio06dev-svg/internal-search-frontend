import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, Input, output, Output } from '@angular/core';

@Component({
  selector: 'app-paginacion',
  imports: [CommonModule],
  template: `
<nav class="pagination-container" aria-label="Navegación de tabla">
      <button 
        class="page-btn" 
        [disabled]="paginaActual() === 1" 
        (click)="cambiarPagina(paginaActual() - 1)">
        Anterior
      </button>

      <span class="page-info">
        Página <strong>{{ paginaActual() }}</strong> de <strong>{{ totalPaginas() }}</strong>
      </span>

      <button 
        class="page-btn" 
        [disabled]="paginaActual() === totalPaginas()" 
        (click)="cambiarPagina(paginaActual() + 1)">
        Siguiente
      </button>
    </nav>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
    .page-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      background-color: #fff;
      border-radius: 0.375rem;
      cursor: pointer;
    }
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginacionComponent {

  // Nuevos inputs basados en signals (con valor por defecto)
  paginaActual = input(1);
  totalElementos = input(0);
  elementosPorPagina = input(5);

  // Nuevo output basado en signals
  cambioPagina = output<number>();

  // Señal computada para calcular el total de páginas automáticamente
  totalPaginas = computed(() => {
    return Math.ceil(this.totalElementos() / this.elementosPorPagina()) || 1;
  });

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.cambioPagina.emit(nuevaPagina);
    }
  }
}
