import { User } from '../../users/entities/user.entity';
import { Sensor } from '../../sensors/entities/sensor.entity';
export declare enum AlertThresholdType {
    ABOVE = "above",
    BELOW = "below",
    EQUAL = "equal",
    BETWEEN = "between"
}
export declare enum AlertStatus {
    ACTIVE = "active",
    TRIGGERED = "triggered",
    RESOLVED = "resolved",
    DISABLED = "disabled"
}
export declare class Alert {
    id: string;
    user: User;
    userId: string;
    sensor: Sensor;
    sensorId: string;
    thresholdType: AlertThresholdType;
    thresholdValue: number;
    thresholdSecondaryValue?: number;
    status: AlertStatus;
    message?: string;
    sendEmail: boolean;
    sendPush: boolean;
    sendSms: boolean;
    lastTriggeredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
