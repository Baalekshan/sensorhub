import { SensorConfig } from './sensor-config.entity';
import { CommunicationPreference } from './communication-preference.entity';
import { User } from './user.entity';
export declare class Device {
    id: string;
    name: string;
    type: string;
    ipAddress: string;
    macAddress: string;
    firmwareVersion: string;
    status: string;
    lastSeenAt: Date;
    metadata: Record<string, any>;
    organizationId: string;
    sensorConfigs: SensorConfig[];
    communicationPreferences: CommunicationPreference;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
