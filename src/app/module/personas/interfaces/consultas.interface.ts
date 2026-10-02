
export interface BuscadorEntrada {
  documento: string;
  tipoDocumento: string;
}

export interface BuscadorResponse {
  esDniValido: boolean;
  documento: string;
  deudas: Deuda[];
  lineasCredito: LineaCredito[];
  calificaciones: Calificacion[];
  sueldos: Sueldo[];
  moviles: Movil[];
}

export interface Deuda {
  periodo: string;
  codigoSbs: string | null;
  documento: string;
  razonSocial: string | null;
  codigoEmpresa: string | null;
  entidad: string | null;
  tipoDeuda: string | null;
  dias: number | null;
  calificacion: string | null;
  saldo: number | null;
  fechaCarga: string;
}

export interface LineaCredito {
  periodo: string | null;
  codigoSbs: string | null;
  documento: string | null;
  razonSocial: string | null;
  codigoEmpresa: string | null;
  entidad: string | null;
  tipo: string | null;
  lineaCreditoMonto: number | null;
  lineaNoUtilizada: number | null;
  lineaUtilizada: number | null;
  fechaCarga: string;
}

export interface Calificacion {
  periodo: string | null;
  codigoSbs: string | null;
  documento: string | null;
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
  fechaCarga: string;
}

export interface Sueldo {
  id: number;
  periodo: string;
  tipoDoc: string | null;
  documento: string | null;
  apeNom: string | null;
  ruc: string | null;
  empresa: string | null;
  genero: string | null;
  montoSueldo: number | null;
  gratifBono: number | null;
  ingresoEstimadoAnual: number | null;
  codRangoSueldo: string | null;
  rangoSueldo: string | null;
  segmentoSueldo: string | null;
  nivelIngreso: string | null;
  fechaCarga: string;
}

export interface Movil {
  periodo: string | null;
  documento: string | null;
  apePat: string | null;
  apeMat: string | null;
  prenombres: string | null;
  telefono: string | null;
  fechaAlta: string | null;
  planMovil: string | null;
  modalidad: string | null;
  empresaOperadora: string | null;
  fechaCarga: string;
}

export interface BuscadorTelefonoResponse {
  telefono: string;
  documentosAsociados: number;
  registros: Movil[];
}


// ---- RENIEC (consulta individual) ----
export interface ReniecPersona {
    nuDni?: string;
    digitoVerificacion?: string;
    apePaterno?: string;
    apeMaterno?: string;
    apCasada?: string;
    preNombres?: string;
    sexo?: string;
    feNacimiento?: string;
    nuEdad?: string;
    estadoCivil?: string;
    gradoInstruccion?: string;
    estatura?: string;
    donaOrganos?: string;
    feEmision?: string;
    feCaducidad?: string;
    feInscripcion?: string;
    deRestriccion?: string;
    desDireccion?: string;
    distDireccion?: string;
    provDireccion?: string;
    depaDireccion?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
    nomPadre?: string;
    nomMadre?: string;
    nuDocMadre?: string;
    nuDocPadre?: string;
    feFallecimiento?: string;
    observacion?: string;
}

export interface ReniecDatos {
    foto?: string;
    firma?: string;
    listaAni?: ReniecPersona[];
}

export interface ReniecResponse {
    dni: string;
    encontrado: boolean;
    datos: ReniecDatos | null;
}
