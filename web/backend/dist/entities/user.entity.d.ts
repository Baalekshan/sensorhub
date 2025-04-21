import { Organization } from './organization.entity';
import { Role } from './role.entity';
import { Device } from './device.entity';
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED"
}
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    status: UserStatus;
    avatarUrl?: string;
    phoneNumber?: string;
    organizationId: string;
    organization: Organization;
    roles: Role[];
    devices: Device[];
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    emailVerified: boolean;
    preferences: Record<string, any>;
}
