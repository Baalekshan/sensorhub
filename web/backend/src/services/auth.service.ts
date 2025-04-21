import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { AuditLog, AuditLogType, AuditLogSeverity } from '../entities/audit-log.entity';

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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2
  ) {}
  
  async authenticateUser(
    credentials: { username: string; password: string }
  ): Promise<AuthenticationResult> {
    try {
      // Find user by email (we're using email instead of username in our entity)
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
      
      // Verify password
      const passwordValid = await this.verifyPassword(credentials.password, user.password);
      
      if (!passwordValid) {
        await this.logFailedLogin(credentials.username, 'INVALID_CREDENTIALS');
        return { success: false, reason: 'INVALID_CREDENTIALS' };
      }
      
      // Check account status
      if (user.status !== UserStatus.ACTIVE) {
        await this.logFailedLogin(credentials.username, user.status);
        return { success: false, reason: user.status };
      }
      
      // Generate tokens
      const tokens = await this.generateUserTokens(user);
      
      // Update last login
      await this.userRepository.update(
        { id: user.id },
        { lastLoginAt: new Date() }
      );
      
      // Log successful login
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
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, reason: 'INTERNAL_ERROR' };
    }
  }
  
  async authorizeAction(
    token: string,
    resource: Resource,
    action: Action
  ): Promise<AuthorizationResult> {
    try {
      // Verify token
      const tokenData = await this.verifyToken(token);
      
      if (!tokenData) {
        return { permitted: false, reason: 'INVALID_TOKEN' };
      }
      
      // Get token scope
      const tokenScope = await this.getTokenScope(token);
      
      // Apply tenant isolation - ensure the resource belongs to the token's organization
      const resourceOrgId = await this.getResourceOrganization(resource.type, resource.id);
      
      if (resourceOrgId && resourceOrgId !== tokenScope.organizationId) {
        await this.logAccessDenied(
          tokenScope.type === 'USER' ? tokenScope.userId : 'api',
          resource,
          action,
          'RESOURCE_NOT_IN_ORGANIZATION'
        );
        return { permitted: false, reason: 'RESOURCE_NOT_IN_ORGANIZATION' };
      }
      
      // Check permissions
      let permitted = false;
      
      if (tokenScope.type === 'USER') {
        // For user tokens, check against RBAC policy
        permitted = await this.userHasPermission(
          tokenScope.userId,
          tokenScope.roles,
          resource.type,
          resource.id,
          action
        );
      } else if (tokenScope.type === 'DEVICE') {
        // For device tokens, check against device permissions
        permitted = this.deviceHasPermission(
          tokenScope.deviceId,
          resource.type,
          resource.id,
          action
        );
      } else if (tokenScope.type === 'API') {
        // For API tokens, check against API token permissions
        permitted = this.apiTokenHasPermission(
          tokenScope.permissions,
          resource.type,
          resource.id,
          action
        );
      }
      
      // Log access attempt
      if (permitted) {
        await this.logAccessGranted(
          tokenScope.type === 'USER' ? tokenScope.userId : 'api',
          resource,
          action
        );
      } else {
        await this.logAccessDenied(
          tokenScope.type === 'USER' ? tokenScope.userId : 'api',
          resource,
          action,
          'PERMISSION_DENIED'
        );
      }
      
      return {
        permitted,
        reason: permitted ? undefined : 'PERMISSION_DENIED'
      };
    } catch (error) {
      console.error('Authorization error:', error);
      return { permitted: false, reason: 'INTERNAL_ERROR' };
    }
  }
  
  async validateDeviceCredentials(
    deviceId: string,
    secret: string
  ): Promise<boolean> {
    // In a real implementation, this would check device credentials
    // For this example, just return true
    return true;
  }
  
  async generateUserTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate access token payload
    const accessPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles.map(r => r.name),
      type: 'access'
    };
    
    // Generate refresh token payload (with fewer claims)
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      jti: Date.now().toString() // Token ID for revocation if needed
    };
    
    // Generate tokens with different expiry times
    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });
    
    return { accessToken, refreshToken };
  }
  
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);
      
      // Ensure it's a refresh token
      if (payload.type !== 'refresh') {
        return null;
      }
      
      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles']
      });
      
      if (!user || user.status !== 'ACTIVE') {
        return null;
      }
      
      // Generate new access token
      const accessPayload = {
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        roles: user.roles.map(r => r.name),
        type: 'access'
      };
      
      const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '1h' });
      
      return { accessToken };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
  
  private async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      return null;
    }
  }
  
  private async getTokenScope(token: string): Promise<TokenScope> {
    const payload = await this.jwtService.verifyAsync(token);
    
    if (payload.type === 'access') {
      // User access token
      return {
        type: 'USER',
        organizationId: payload.organizationId,
        userId: payload.sub,
        roles: payload.roles
      };
    } else if (payload.type === 'device') {
      // Device token
      return {
        type: 'DEVICE',
        organizationId: payload.organizationId,
        deviceId: payload.deviceId,
        permissions: payload.permissions
      };
    } else if (payload.type === 'api') {
      // API token
      return {
        type: 'API',
        organizationId: payload.organizationId,
        permissions: payload.permissions
      };
    }
    
    throw new Error('Unknown token type');
  }
  
  private async getResourceOrganization(
    resourceType: string,
    resourceId: string
  ): Promise<string | null> {
    // This is a simplified implementation
    // In a real system, you would have a more sophisticated way to determine
    // which organization a resource belongs to
    
    switch (resourceType) {
      case 'users':
        const user = await this.userRepository.findOne({
          where: { id: resourceId }
        });
        return user?.organizationId;
      
      case 'devices':
        // Query device repository
        return null; // Placeholder
      
      case 'sensors':
        // Query sensor repository
        return null; // Placeholder
      
      default:
        return null;
    }
  }
  
  async enforceDataIsolation(
    userId: string,
    resource: string,
    action: Action
  ): Promise<DataAccessScope> {
    // Get user with organization
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user has permission for the action
    const hasPermission = await this.userHasPermission(
      user.id,
      user.roles.map(r => r.name),
      resource,
      null,
      action
    );
    
    if (!hasPermission) {
      throw new Error('Permission denied');
    }
    
    // Get data access scope
    return {
      organizationId: user.organizationId,
      userId: user.id,
      roles: user.roles.map(r => r.name),
      scope: this.determineDataScope(user.roles.map(r => r.name), resource, action)
    };
  }
  
  private determineDataScope(
    roles: string[],
    resource: string,
    action: Action
  ): DataScope {
    // Determine if user has organization-wide or limited access
    const isAdmin = roles.includes('ADMIN');
    const isDeviceManager = roles.includes('DEVICE_MANAGER');
    
    if (isAdmin) {
      // Admins have full organization access
      return {
        type: 'ORGANIZATION',
        filters: {}
      };
    }
    
    if (isDeviceManager && resource === 'devices') {
      // Device managers have access to all devices
      return {
        type: 'ORGANIZATION',
        filters: {
          resourceType: 'devices'
        }
      };
    }
    
    // Regular users have access to assigned devices only
    return {
      type: 'ASSIGNED',
      filters: {
        resourceType: resource
      }
    };
  }
  
  async userHasPermission(
    userId: string,
    roles: string[],
    resourceType: string,
    resourceId: string | null,
    action: Action
  ): Promise<boolean> {
    // Admin role has all permissions
    if (roles.includes('ADMIN')) {
      return true;
    }
    
    // Get permissions for user's roles
    const userRoles = await this.roleRepository.find({
      where: { name: In(roles) },
      relations: ['permissions']
    });
    
    // Check if any role has the required permission
    for (const role of userRoles) {
      for (const permission of role.permissions) {
        if (
          permission.resource === resourceType &&
          permission.actions.includes(action)
        ) {
          // If specific resource ID is provided, check additional access control
          if (resourceId) {
            // Check if user has access to this specific resource
            // This would typically involve checking assignments or ownership
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
  
  private async userHasResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    // This is a placeholder implementation
    // In a real system, you would check if the user is assigned to or owns this resource
    
    // For example, for devices, check if the user is assigned to this device
    if (resourceType === 'devices') {
      // Check device assignments
      return true; // Placeholder
    }
    
    return false;
  }
  
  private deviceHasPermission(
    deviceId: string,
    resourceType: string,
    resourceId: string | null,
    action: Action
  ): boolean {
    // Devices typically have very limited permissions
    // For example, a device can only update its own data
    
    // A device can update its own data
    if (resourceType === 'devices' && resourceId === deviceId && action === 'update') {
      return true;
    }
    
    // A device can create readings for itself
    if (resourceType === 'readings' && action === 'create') {
      return true;
    }
    
    return false;
  }
  
  private apiTokenHasPermission(
    permissions: string[],
    resourceType: string,
    resourceId: string | null,
    action: Action
  ): boolean {
    // API tokens have explicit permissions in the format 'resourceType:action'
    const requiredPermission = `${resourceType}:${action}`;
    
    // Check if the token has this specific permission
    // or a wildcard permission for the resource type
    return (
      permissions.includes(requiredPermission) ||
      permissions.includes(`${resourceType}:*`) ||
      permissions.includes('*:*')
    );
  }
  
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
  
  private async logFailedLogin(
    username: string,
    reason: string
  ): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        type: AuditLogType.LOGIN,
        action: 'LOGIN_FAILED',
        details: {
          username,
          reason,
          timestamp: new Date()
        },
        severity: AuditLogSeverity.WARNING
      });
      
      await this.auditLogRepository.save(log);
      
      this.eventEmitter.emit('auth.login.failed', {
        username,
        reason,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log failed login:', error);
    }
  }
  
  private async logSuccessfulLogin(userId: string): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        type: AuditLogType.LOGIN,
        action: 'LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: userId,
        userId,
        severity: AuditLogSeverity.INFO
      });
      
      await this.auditLogRepository.save(log);
      
      this.eventEmitter.emit('auth.login.success', {
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log successful login:', error);
    }
  }
  
  private async logAccessGranted(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        type: AuditLogType.READ,
        action: `ACCESS_GRANTED_${action.toUpperCase()}`,
        entityType: resource.type,
        entityId: resource.id,
        userId,
        details: {
          action,
          resource,
          timestamp: new Date()
        },
        severity: AuditLogSeverity.INFO
      });
      
      await this.auditLogRepository.save(log);
    } catch (error) {
      console.error('Failed to log access granted:', error);
    }
  }
  
  private async logAccessDenied(
    userId: string,
    resource: Resource,
    action: Action,
    reason: string
  ): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        type: AuditLogType.ERROR,
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
        severity: AuditLogSeverity.WARNING
      });
      
      await this.auditLogRepository.save(log);
      
      this.eventEmitter.emit('auth.access.denied', {
        userId,
        action,
        resource,
        reason,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log access denied:', error);
    }
  }
} 