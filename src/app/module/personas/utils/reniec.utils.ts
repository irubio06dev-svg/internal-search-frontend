import { ReniecPersona } from '../interfaces/consultas.interface';

export interface SeccionReniec {
    titulo: string;
    campos: { etiqueta: string; valor: string }[];
}

export function textoReniec(valor: string | null | undefined, alternativo = 'No disponible'): string {
    const limpio = valor?.trim();
    return !limpio || limpio.toUpperCase() === 'NULL' ? alternativo : limpio;
}

export function nombreReniec(p: ReniecPersona | null | undefined): string {
    return p ? [p.apePaterno, p.apeMaterno, p.preNombres].map(v => textoReniec(v, '')).filter(Boolean).join(' ') : '';
}

// El proveedor entrega foto y firma en base64 (JPEG)
export function imagenReniec(base64: string | undefined): string | null {
    return base64 ? `data:image/jpeg;base64,${base64}` : null;
}

// Mismos bloques de "etiqueta / valor" que usa el resto de la consulta (phone-grid)
export function seccionesReniec(p: ReniecPersona | null | undefined): SeccionReniec[] {
    if (!p) return [];
    const t = (v?: string) => textoReniec(v);

    return [
        {
            titulo: 'Identidad',
            campos: [
                { etiqueta: 'DNI', valor: `${t(p.nuDni)}${p.digitoVerificacion ? '-' + p.digitoVerificacion : ''}` },
                { etiqueta: 'Sexo', valor: t(p.sexo) },
                { etiqueta: 'Estado civil', valor: t(p.estadoCivil) },
                { etiqueta: 'Grado de instrucción', valor: t(p.gradoInstruccion) },
                { etiqueta: 'Estatura', valor: t(p.estatura) },
                { etiqueta: 'Donación de órganos', valor: t(p.donaOrganos) },
            ],
        },
        {
            titulo: 'Nacimiento y documento',
            campos: [
                { etiqueta: 'Fecha de nacimiento', valor: t(p.feNacimiento) },
                { etiqueta: 'Edad', valor: t(p.nuEdad) },
                { etiqueta: 'Fecha de inscripción', valor: t(p.feInscripcion) },
                { etiqueta: 'Fecha de emisión', valor: t(p.feEmision) },
                { etiqueta: 'Fecha de caducidad', valor: t(p.feCaducidad) },
                { etiqueta: 'Restricción', valor: t(p.deRestriccion) },
            ],
        },
        {
            titulo: 'Domicilio',
            campos: [
                { etiqueta: 'Dirección', valor: t(p.desDireccion) },
                { etiqueta: 'Distrito', valor: t(p.distDireccion) },
                { etiqueta: 'Provincia', valor: t(p.provDireccion) },
                { etiqueta: 'Departamento', valor: t(p.depaDireccion) },
            ],
        },
        {
            titulo: 'Lugar de nacimiento',
            campos: [
                { etiqueta: 'Distrito', valor: t(p.distrito) },
                { etiqueta: 'Provincia', valor: t(p.provincia) },
                { etiqueta: 'Departamento', valor: t(p.departamento) },
            ],
        },
        {
            titulo: 'Padres',
            campos: [
                { etiqueta: 'Padre', valor: t(p.nomPadre) },
                { etiqueta: 'Madre', valor: t(p.nomMadre) },
            ],
        },
    ];
}
