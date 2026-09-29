export interface ResponseRoute {
    codMenu: number;
    codMenuPadre: number | null;
    nomMenu: string;
    ruta: string;
    icono: string;
    orden: number;
    puedeVer: number;
    puedeCrear: number;
    puedeEditar: number;
    puedeEliminar: number;
    children: ResponseRoute[];
}
