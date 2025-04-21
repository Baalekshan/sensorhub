export declare enum PermissionType {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    ADMIN = "ADMIN",
    SPECIAL = "SPECIAL"
}
export declare enum PermissionScope {
    USER = "USER",
    ORGANIZATION = "ORGANIZATION",
    DEVICE = "DEVICE",
    SENSOR = "SENSOR",
    READING = "READING",
    ALERT = "ALERT",
    FIRMWARE = "FIRMWARE",
    REPORT = "REPORT",
    DASHBOARD = "DASHBOARD",
    SETTING = "SETTING",
    SYSTEM = "SYSTEM"
}
export declare class Permission {
    id: string;
    name: string;
    description?: string;
    type: PermissionType;
    scope: PermissionScope;
    resource: string;
    actions: string[];
    isActive: boolean;
    createdAt: Date;
}
