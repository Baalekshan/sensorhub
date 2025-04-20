import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private configService;
    private usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(req: Request, payload: JwtPayload): Promise<{
        refreshToken: string;
        id: string;
        name: string;
        email: string;
        password: string;
        role: import("../../users/entities/user.entity").UserRole;
        avatar?: string;
        googleId?: string;
        appleId?: string;
        devices?: import("../../devices/entities/device.entity").Device[];
        alerts?: import("../../notifications/entities/alert.entity").Alert[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
