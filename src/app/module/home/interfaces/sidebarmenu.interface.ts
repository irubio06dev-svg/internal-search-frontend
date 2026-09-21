// sidebar-menu-items.ts
export interface MenuItem {
    label: string;
    route: string;
    iconPath: string; // el valor del atributo "d" del path
}

export const MENU_ITEMS: MenuItem[] = [
    {
        label: 'Dashboard',
        route: '/dashboard',
        iconPath: 'dasboard'
    },
    {
        label: 'Predicción',
        route: '/prediccion',
        iconPath: 'prediction'
    },
    {
        label: 'Historial',
        route: '/historial',
        iconPath: 'historic'
    },
    {
        label: 'Pacientes',
        route: '/pacientes',
        iconPath: 'patient'
    },
    {
        label: 'Reportes',
        route: '/reportes',
        iconPath: 'report'
    },
    {
        label: 'Estadísticas',
        route: '/estadisticas',
        iconPath: 'stadistic'
    },
    {
        label: 'Usuarios',
        route: '/usuarios',
        iconPath: 'userSideBar'
    },
    {
        label: 'Configuración',
        route: '/configuracion',
        iconPath: 'config'
    }
];
