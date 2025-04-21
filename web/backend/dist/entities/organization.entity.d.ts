import { User } from './user.entity';
export declare enum OrganizationStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED"
}
export declare class Organization {
    id: string;
    name: string;
    description?: string;
    status: OrganizationStatus;
    logoUrl?: string;
    website?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    createdAt: Date;
    updatedAt: Date;
    users: User[];
    settings: Record<string, any>;
}
