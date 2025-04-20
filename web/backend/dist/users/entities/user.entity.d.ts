import { Device } from '../../devices/entities/device.entity';
import { Alert } from '../../notifications/entities/alert.entity';
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user"
}
export declare class User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    avatar?: string;
    googleId?: string;
    appleId?: string;
    devices?: Device[];
    alerts?: Alert[];
    createdAt: Date;
    updatedAt: Date;
}
