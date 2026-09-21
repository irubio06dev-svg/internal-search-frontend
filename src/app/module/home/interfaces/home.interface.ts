export interface ResponseRoute {
    cod_route: number;
    route_name: string;
    route_path: string;
    full_path?: string;   // <-- nuevo campo calculado
    description?: string | null;
    cod_route_parent?: number | null;
    icon_name: string;
    children?: ResponseRoute[];
}
