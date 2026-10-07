# --- Etapa 1: Compilar el frontend ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --configuration=production

# --- Etapa 2: Servir con Nginx ---
FROM nginx:alpine

# Copiamos la carpeta de producción del navegador basada en el nombre del proyecto ("internal-search")
COPY --from=build /app/dist/internal-search/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]