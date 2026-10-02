import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El portal depende de la sesión (token en localStorage), que el servidor no conoce: renderizarlo
  // en servidor lo mandaba al login y, al recargar cualquier pantalla, se perdía la ruta y caía en la portada.
  // Se renderiza en el navegador, donde sí existe la sesión.
  {
    path: 'system',
    renderMode: RenderMode.Client
  },
  {
    path: 'system/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
