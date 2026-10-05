// Se ejecuta solo antes de `npm run build` (script "prebuild").
// Si existe la variable API_URL (se define en Vercel: Settings → Environment Variables) escribe
// src/environments/environment.ts con esa URL. Sin la variable no toca nada, así que el build local
// y el desarrollo (`npm start`, que usa environment.development.ts) siguen igual.
const fs = require('fs');
const path = require('path');

const url = (process.env.API_URL || '').trim();

if (!url) {
    console.log('[set-env] API_URL no está definida: se usa src/environments/environment.ts tal cual.');
    process.exit(0);
}

// La API debe ir por HTTPS: el sitio de Vercel es HTTPS y el navegador bloquea llamadas HTTP (contenido mixto).
if (!/^https:\/\/[^\s/]+/i.test(url)) {
    console.error(`[set-env] API_URL inválida: "${url}". Debe empezar con https:// (ej. https://api.tudominio.com).`);
    process.exit(1);
}

const baseUrl = url.endsWith('/') ? url : `${url}/`;
const destino = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');

fs.writeFileSync(
    destino,
    `// Generado por scripts/set-env.js a partir de API_URL. No editar a mano en el despliegue.\n` +
    `export const environment = {\n    produccion: true,\n    baseUrl: '${baseUrl}'\n};\n`,
);

console.log(`[set-env] environment.ts → baseUrl = ${baseUrl}`);
