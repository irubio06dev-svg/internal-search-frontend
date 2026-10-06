import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment'; // ajusta la ruta
import { ProgresoSubida } from '../interfaces/masivas-empresas.interface';
import { HistorialDescarga, RecepcionHistorial } from '../interfaces/historial-empresas.interface';

@Injectable({ providedIn: 'root' })
export class ConsultasMasivasEmpresaService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.baseUrl.replace(/\/$/, '');

    /**
     * Sube el archivo con las secciones elegidas y reporta el progreso.
     * Al terminar entrega el Excel como Blob y el nombre sugerido por el backend.
     */
    exportarMasivo(archivo: File, secciones: readonly string[]): Observable<ProgresoSubida> {
        const formData = new FormData();
        formData.append('archivo', archivo, archivo.name);
        // Una entrada por sección, con la misma clave: así ASP.NET llena el string[]
        secciones.forEach(seccion => formData.append('secciones', seccion));

        return this.http
            .post(`${this.baseUrl}/api/empresa/masivo/exportar`, formData, {
                reportProgress: true,
                observe: 'events',  
                responseType: 'blob',
            })
            .pipe(
                timeout({ each: 300_000 }),
                filter(
                    event =>
                        event.type === HttpEventType.UploadProgress ||
                        event.type === HttpEventType.Response,
                ),
                map((event): ProgresoSubida => {
                    if (event.type === HttpEventType.UploadProgress) {
                        const porcentaje = event.total
                            ? Math.round((event.loaded / event.total) * 100)
                            : 0;
                        return { tipo: 'progreso', porcentaje };
                    }

                    // HttpEventType.Response
                    return {
                        tipo: 'completado',
                        archivo: event.body ?? undefined,
                        nombreArchivo: this.extraerNombreArchivo(
                            event.headers.get('Content-Disposition'),
                        ),
                    };
                }),
            );
    }

    private extraerNombreArchivo(disposition: string | null): string {
        const porDefecto = 'Resultado_Empresa_Masivo.xlsx';
        if (!disposition) return porDefecto;

        const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8) return decodeURIComponent(utf8[1]);

        const simple = disposition.match(/filename="?([^";]+)"?/i);
        return simple ? simple[1] : porDefecto;
    }

    descargarBlob(blob: Blob, nombreArchivo: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }

    /** Lee el mensaje de error que el backend manda como Blob en un BadRequest */
    leerMensajeError(blob: Blob): Promise<string> {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                let mensaje = 'Ocurrió un error al procesar el archivo.';
                try {
                    const parsed = JSON.parse(reader.result as string);
                    mensaje = parsed.message || parsed.title || mensaje;
                } catch {
                    if (reader.result) mensaje = (reader.result as string).replace(/^"|"$/g, '');
                }
                resolve(mensaje);
            };
            reader.onerror = () => resolve('Ocurrió un error al procesar el archivo.');
            reader.readAsText(blob);
        });
    }


    obtenerHistorial(codUsuario: number): Observable<HistorialDescarga[]> {

        return this.http.get<HistorialDescarga[]>(
            `${this.baseUrl}/api/historial/usuario/${codUsuario}`
        );
    }

    enviarHistorial(archivoExcel: Blob, nombreArchivo: string, secciones: readonly string[], totalDnis: number): Observable<RecepcionHistorial> {
        const datos = new FormData();
        datos.append('archivoExcel', archivoExcel, nombreArchivo);
        secciones.forEach(seccion => datos.append('secciones', seccion));
        datos.append('totalDnis', String(totalDnis));
        return this.http.post<RecepcionHistorial>(`${this.baseUrl}/api/historial/masivo/historial`, datos)
            .pipe(timeout(60_000));
    }


    descargarHistorial(codHistorial: number): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/api/historial/${codHistorial}/descargar`,
            { responseType: 'blob' }
        );
    }

}
