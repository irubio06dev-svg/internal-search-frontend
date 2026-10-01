export interface DeudaEmpresa {
    periodo: string;
    codigoSbs: string;
    documento: string;
    razonSocial: string | null;
    entidad: string | null;
    tipoDeuda: string | null;
    dias: number | null;
    calificacion: string | null;
    saldo: number | null;
}
export interface LineaCreditoEmpresa {
    periodo: string;
    codigoSbs: string;
    documento: string;
    razonSocial: string | null;
    entidad: string | null;
    tipo: string | null;
    lineaCreditoMonto: number | null;
    lineaNoUtilizada: number | null;
    lineaUtilizada: number | null;
}
export interface CalificacionEmpresa {
    periodo: string;
    codigoSbs: string;
    documento: string;
    nor: number | null;
    cpp: number | null;
    def: number | null;
    dud: number | null;
    per: number | null;
    reportan: string | null;
    apePat: string | null;
    apeMat: string | null;
    priNombre: string | null;
    segNombre: string | null;
}
export interface EmpresaResponse {
    moviles: Record<string, unknown>[];
    sueldos: Record<string, unknown>[];
    deudas: DeudaEmpresa[];
    lineasCredito: LineaCreditoEmpresa[];
    calificaciones: CalificacionEmpresa[];
}
