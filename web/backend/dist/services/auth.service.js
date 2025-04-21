"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const event_emitter_1 = require("@nestjs/event-emitter");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../entities/user.entity");
const organization_entity_1 = require("../entities/organization.entity");
const role_entity_1 = require("../entities/role.entity");
const permission_entity_1 = require("../entities/permission.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
let AuthService = class AuthService {
    constructor(userRepository, organizationRepository, roleRepository, permissionRepository, auditLogRepository, jwtService, eventEmitter) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.jwtService = jwtService;
        this.eventEmitter = eventEmitter;
    }
    async authenticateUser(credentials) {
        try {
            const user = await this.userRepository.findOne({
                where: [
                    { email: credentials.username }
                ],
                relations: ['roles']
            });
            if (!user) {
                await this.logFailedLogin(credentials.username, 'INVALID_CREDENTIALS');
                return { success: false, reason: 'INVALID_CREDENTIALS' };
            }
            const passwordValid = await this.verifyPassword(credentials.password, user.password);
            if (!passwordValid) {
                await this.logFailedLogin(credentials.username, 'INVALID_CREDENTIALS');
                return { success: false, reason: 'INVALID_CREDENTIALS' };
            }
            if (user.status !== user_entity_1.UserStatus.ACTIVE) {
                await this.logFailedLogin(credentials.username, user.status);
                return { success: false, reason: user.status };
            }
            const tokens = await this.generateUserTokens(user);
            await this.userRepository.update({ id: user.id }, { lastLoginAt: new Date() });
            await this.logSuccessfulLogin(user.id);
            return {
                success: true,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    organizationId: user.organizationId,
                    roles: user.roles.map(r => r.name)
                }
            };
        }
        catch (error) {
            console.error('Authentication error:', error);
            return { success: false, reason: 'INTERNAL_ERROR' };
        }
    }
    async authorizeAction(token, resource, action) {
        try {
            const tokenData = await this.verifyToken(token);
            if (!tokenData) {
                return { permitted: false, reason: 'INVALID_TOKEN' };
            }
            const tokenScope = await this.getTokenScope(token);
            const resourceOrgId = await this.getResourceOrganization(resource.type, resource.id);
            if (resourceOrgId && resourceOrgId !== tokenScope.organizationId) {
                await this.logAccessDenied(tokenScope.type === 'USER' ? tokenScope.userId : 'api', resource, action, 'RESOURCE_NOT_IN_ORGANIZATION');
                return { permitted: false, reason: 'RESOURCE_NOT_IN_ORGANIZATION' };
            }
            let permitted = false;
            if (tokenScope.type === 'USER') {
                permitted = await this.userHasPermission(tokenScope.userId, tokenScope.roles, resource.type, resource.id, action);
            }
            else if (tokenScope.type === 'DEVICE') {
                permitted = this.deviceHasPermission(tokenScope.deviceId, resource.type, resource.id, action);
            }
            else if (tokenScope.type === 'API') {
                permitted = this.apiTokenHasPermission(tokenScope.permissions, resource.type, resource.id, action);
            }
            if (permitted) {
                await this.logAccessGranted(tokenScope.type === 'USER' ? tokenScope.userId : 'api', resource, action);
            }
            else {
                await this.logAccessDenied(tokenScope.type === 'USER' ? tokenScope.userId : 'api', resource, action, 'PERMISSION_DENIED');
            }
            return {
                permitted,
                reason: permitted ? undefined : 'PERMISSION_DENIED'
            };
        }
        catch (error) {
            console.error('Authorization error:', error);
            return { permitted: false, reason: 'INTERNAL_ERROR' };
        }
    }
    async validateDeviceCredentials(deviceId, secret) {
        return true;
    }
    async generateUserTokens(user) {
        const accessPayload = {
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roles: user.roles.map(r => r.name),
            type: 'access'
        };
        const refreshPayload = {
            sub: user.id,
            type: 'refresh',
            jti: Date.now().toString()
        };
        const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    async refreshAccessToken(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            if (payload.type !== 'refresh') {
                return null;
            }
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
                relations: ['roles']
            });
            if (!user || user.status !== 'ACTIVE') {
                return null;
            }
            const accessPayload = {
                sub: user.id,
                email: user.email,
                organizationId: user.organizationId,
                roles: user.roles.map(r => r.name),
                type: 'access'
            };
            const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '1h' });
            return { accessToken };
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return null;
        }
    }
    async verifyToken(token) {
        try {
            return await this.jwtService.verifyAsync(token);
        }
        catch (error) {
            return null;
        }
    }
    async getTokenScope(token) {
        const payload = await this.jwtService.verifyAsync(token);
        if (payload.type === 'access') {
            return {
                type: 'USER',
                organizationId: payload.organizationId,
                userId: payload.sub,
                roles: payload.roles
            };
        }
        else if (payload.type === 'device') {
            return {
                type: 'DEVICE',
                organizationId: payload.organizationId,
                deviceId: payload.deviceId,
                permissions: payload.permissions
            };
        }
        else if (payload.type === 'api') {
            return {
                type: 'API',
                organizationId: payload.organizationId,
                permissions: payload.permissions
            };
        }
        throw new Error('Unknown token type');
    }
    async getResourceOrganization(resourceType, resourceId) {
        switch (resourceType) {
            case 'users':
                const user = await this.userRepository.findOne({
                    where: { id: resourceId }
                });
                return user === null || user === void 0 ? void 0 : user.organizationId;
            case 'devices':
                return null;
            case 'sensors':
                return null;
            default:
                return null;
        }
    }
    async enforceDataIsolation(userId, resource, action) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });
        if (!user) {
            throw new Error('User not found');
        }
        const hasPermission = await this.userHasPermission(user.id, user.roles.map(r => r.name), resource, null, action);
        if (!hasPermission) {
            throw new Error('Permission denied');
        }
        return {
            organizationId: user.organizationId,
            userId: user.id,
            roles: user.roles.map(r => r.name),
            scope: this.determineDataScope(user.roles.map(r => r.name), resource, action)
        };
    }
    determineDataScope(roles, resource, action) {
        const isAdmin = roles.includes('ADMIN');
        const isDeviceManager = roles.includes('DEVICE_MANAGER');
        if (isAdmin) {
            return {
                type: 'ORGANIZATION',
                filters: {}
            };
        }
        if (isDeviceManager && resource === 'devices') {
            return {
                type: 'ORGANIZATION',
                filters: {
                    resourceType: 'devices'
                }
            };
        }
        return {
            type: 'ASSIGNED',
            filters: {
                resourceType: resource
            }
        };
    }
    async userHasPermission(userId, roles, resourceType, resourceId, action) {
        if (roles.includes('ADMIN')) {
            return true;
        }
        const userRoles = await this.roleRepository.find({
            where: { name: (0, typeorm_2.In)(roles) },
            relations: ['permissions']
        });
        for (const role of userRoles) {
            for (const permission of role.permissions) {
                if (permission.resource === resourceType &&
                    permission.actions.includes(action)) {
                    if (resourceId) {
                        const hasAccess = await this.userHasResourceAccess(userId, resourceType, resourceId);
                        if (!hasAccess) {
                            continue;
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }
    async userHasResourceAccess(userId, resourceType, resourceId) {
        if (resourceType === 'devices') {
            return true;
        }
        return false;
    }
    deviceHasPermission(deviceId, resourceType, resourceId, action) {
        if (resourceType === 'devices' && resourceId === deviceId && action === 'update') {
            return true;
        }
        if (resourceType === 'readings' && action === 'create') {
            return true;
        }
        return false;
    }
    apiTokenHasPermission(permissions, resourceType, resourceId, action) {
        const requiredPermission = `${resourceType}:${action}`;
        return (permissions.includes(requiredPermission) ||
            permissions.includes(`${resourceType}:*`) ||
            permissions.includes('*:*'));
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }
    async logFailedLogin(username, reason) {
        try {
            const log = this.auditLogRepository.create({
                type: audit_log_entity_1.AuditLogType.LOGIN,
                action: 'LOGIN_FAILED',
                details: {
                    username,
                    reason,
                    timestamp: new Date()
                },
                severity: audit_log_entity_1.AuditLogSeverity.WARNING
            });
            await this.auditLogRepository.save(log);
            this.eventEmitter.emit('auth.login.failed', {
                username,
                reason,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Failed to log failed login:', error);
        }
    }
    async logSuccessfulLogin(userId) {
        try {
            const log = this.auditLogRepository.create({
                type: audit_log_entity_1.AuditLogType.LOGIN,
                action: 'LOGIN_SUCCESS',
                entityType: 'USER',
                entityId: userId,
                userId,
                severity: audit_log_entity_1.AuditLogSeverity.INFO
            });
            await this.auditLogRepository.save(log);
            this.eventEmitter.emit('auth.login.success', {
                userId,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Failed to log successful login:', error);
        }
    }
    async logAccessGranted(userId, resource, action) {
        try {
            const log = this.auditLogRepository.create({
                type: audit_log_entity_1.AuditLogType.READ,
                action: `ACCESS_GRANTED_${action.toUpperCase()}`,
                entityType: resource.type,
                entityId: resource.id,
                userId,
                details: {
                    action,
                    resource,
                    timestamp: new Date()
                },
                severity: audit_log_entity_1.AuditLogSeverity.INFO
            });
            await this.auditLogRepository.save(log);
        }
        catch (error) {
            console.error('Failed to log access granted:', error);
        }
    }
    async logAccessDenied(userId, resource, action, reason) {
        try {
            const log = this.auditLogRepository.create({
                type: audit_log_entity_1.AuditLogType.ERROR,
                action: `ACCESS_DENIED_${action.toUpperCase()}`,
                entityType: resource.type,
                entityId: resource.id,
                userId,
                details: {
                    action,
                    resource,
                    reason,
                    timestamp: new Date()
                },
                severity: audit_log_entity_1.AuditLogSeverity.WARNING
            });
            await this.auditLogRepository.save(log);
            this.eventEmitter.emit('auth.access.denied', {
                userId,
                action,
                resource,
                reason,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Failed to log access denied:', error);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(3, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        event_emitter_1.EventEmitter2])
], AuthService);
//# sourceMappingURL=auth.service.js.map