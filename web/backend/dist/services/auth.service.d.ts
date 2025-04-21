import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AuditLog } from '../entities/audit-log.entity';
export interface AuthenticationResult {
    success: boolean;
    reason?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        organizationId: string;
        roles: string[];
    };
}
export interface AuthorizationResult {
    permitted: boolean;
    reason?: string;
}
export interface Resource {
    type: string;
    id: string;
}
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute';
export interface TokenScope {
    type: 'USER' | 'DEVICE' | 'API';
    organizationId: string;
    userId?: string;
    deviceId?: string;
    roles?: string[];
    permissions?: string[];
}
export interface DataAccessScope {
    organizationId: string;
    userId: string;
    roles: string[];
    scope: DataScope;
}
export interface DataScope {
    type: 'ORGANIZATION' | 'ASSIGNED';
    filters: Record<string, any>;
}
export declare class AuthService {
    private userRepository;
    private organizationRepository;
    private roleRepository;
    private permissionRepository;
    private auditLogRepository;
    private jwtService;
    private eventEmitter;
    constructor(userRepository: Repository<User>, organizationRepository: Repository<Organization>, roleRepository: Repository<Role>, permissionRepository: Repository<Permission>, auditLogRepository: Repository<AuditLog>, jwtService: JwtService, eventEmitter: EventEmitter2);
    authenticateUser(credentials: {
        username: string;
        password: string;
    }): Promise<AuthenticationResult>;
    authorizeAction(token: string, resource: Resource, action: Action): Promise<AuthorizationResult>;
    validateDeviceCredentials(deviceId: string, secret: string): Promise<boolean>;
    generateUserTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    } | null>;
    private verifyToken;
    private getTokenScope;
    private getResourceOrganization;
    enforceDataIsolation(userId: string, resource: string, action: Action): Promise<DataAccessScope>;
    private determineDataScope;
    userHasPermission(userId: string, roles: string[], resourceType: string, resourceId: string | null, action: Action): Promise<boolean>;
    private userHasResourceAccess;
    private deviceHasPermission;
    private apiTokenHasPermission;
    private verifyPassword;
    private hashPassword;
    private logFailedLogin;
    private logSuccessfulLogin;
    private logAccessGranted;
    private logAccessDenied;
}
