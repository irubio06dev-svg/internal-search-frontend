// Entorno de PRODUCCIÓN (ng build). Con `ng serve` / `ng build --configuration development`
// Angular lo sustituye por environment.development.ts.
//
// Antes de desplegar, pon aquí la URL real de la API, con barra final:
//   - API en otro dominio/puerto:  'https://api.tudominio.com/'
//   - Front y API bajo el mismo dominio detrás de un proxy:  '/'
export const environment = {
    produccion: true,
    baseUrl: 'http://localhost:8080/'
};
