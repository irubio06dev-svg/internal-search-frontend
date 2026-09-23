// buscador-entrada.model.ts
export interface BuscadorEntrada {
    tipoDocumento: string;
    documento?: string | null;
    apePat?: string | null;
    apeMat?: string | null;
    prenombres?: string | null;
    telefono?: string | null;
}

// calificacion.model.ts
export interface Calificacion {
    periodo?: string | null;
    codigoSbs?: string | null;
    documento?: string | null;
    nor?: number | null;
    cpp?: number | null;
    def?: number | null;
    dud?: number | null;
    per?: number | null;
    reportan?: string | null;
    apePat?: string | null;
    apeMat?: string | null;
    priNombre?: string | null;
    segNombre?: string | null;
    fechaCarga: string; // ISO date string
}

// deuda.model.ts
export interface Deuda {
    periodo?: string | null;
    codigoSbs?: string | null;
    documento?: string | null;
    razonSocial?: string | null;
    codigoEmpresa?: string | null;
    entidad?: string | null;
    tipoDeuda?: string | null;
    dias?: number | null;
    calificacion?: string | null;
    saldo?: number | null;
    fechaCarga: string;
}

// linea-credito.model.ts
export interface LineaCredito {
    periodo?: string | null;
    codigoSbs?: string | null;
    documento?: string | null;
    razonSocial?: string | null;
    codigoEmpresa?: string | null;
    entidad?: string | null;
    tipo?: string | null;
    lineaCreditoMonto?: number | null;
    lineaNoUtilizada?: number | null;
    lineaUtilizada?: number | null;
    fechaCarga: string;
}

// movil.model.ts
export interface Movil {
    periodo?: string | null;
    documento?: string | null;
    apePat?: string | null;
    apeMat?: string | null;
    prenombres?: string | null;
    telefono?: string | null;
    fechaAlta?: string | null;
    planMovil?: string | null;
    modalidad?: string | null;
    empresaOperadora?: string | null;
    fechaCarga: string;
}

export interface BuscadorResponse {
    calificaciones: Calificacion[];
    deudas: Deuda[];
    lineasCredito: LineaCredito[];
    moviles: Movil[];
}