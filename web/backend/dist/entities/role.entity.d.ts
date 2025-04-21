import { Permission } from './permission.entity';
export declare class Role {
    id: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions: Permission[];
}
