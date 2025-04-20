import { AuthService } from './auth.service';
import { LoginInput, RegisterInput, RefreshTokensInput } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
export declare class AuthResolver {
    private authService;
    constructor(authService: AuthService);
    login(input: LoginInput): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    register(input: RegisterInput): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    refreshTokens(user: User & {
        refreshToken: string;
    }, input: RefreshTokensInput): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
}
