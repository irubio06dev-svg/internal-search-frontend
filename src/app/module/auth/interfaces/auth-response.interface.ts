export interface authResponse {
    success: 1 | 0 | -1 | 2 | 3;
    message: string;
    data: {
        token: string;
        user: UserResponse
    }
}

export interface UserResponse {
    cod_user: number;
    username: string;
    cod_role: number;
    name: string;
    first_name: string;
    state: string;

    password_hash: string;
    name_role: string;
}
