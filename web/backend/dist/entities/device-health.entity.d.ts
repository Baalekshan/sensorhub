export declare class DeviceHealth {
    id: string;
    deviceId: string;
    timestamp: Date;
    memoryUsed: number;
    memoryTotal: number;
    cpuLoad: number;
    flashUsed: number;
    flashTotal: number;
    batteryLevel: number;
    batteryCharging: boolean;
    batteryHoursRemaining: number;
    signalStrength: number;
    latency: number;
    packetLoss: number;
    uptime: number;
    ipAddress: string;
    freeHeap: number;
    temperature: number;
    restarts: number;
    networkInfo: {
        type?: string;
        ssid?: string;
        rssi?: number;
        bssid?: string;
        ipAddress?: string;
        gatewayIp?: string;
        subnetMask?: string;
        dns?: string[];
    };
    errors: {
        type: string;
        count: number;
        lastTimestamp: string;
        message: string;
    }[];
    organizationId: string;
    createdAt: Date;
}
