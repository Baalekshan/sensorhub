import { User } from './user.entity';
export declare enum AuditLogType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    READ = "READ",
    ERROR = "ERROR",
    SYSTEM = "SYSTEM"
}
export declare enum AuditLogSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export declare class AuditLog {
    id: string;
    type: AuditLogType;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity: AuditLogSeverity;
    userId?: string;
    user?: User;
    createdAt: Date;
}
