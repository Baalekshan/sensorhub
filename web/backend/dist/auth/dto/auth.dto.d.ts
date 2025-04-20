export declare class LoginInput {
    email: string;
    password: string;
}
export declare class RegisterInput {
    email: string;
    password: string;
    name: string;
}
export declare class RefreshTokensInput {
    dummy?: string;
}
export declare class UserResponse {
    id: string;
    name: string;
    email: string;
    role: string;
}
export declare class LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: UserResponse;
}
