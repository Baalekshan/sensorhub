export declare class CommunicationPreference {
    id: string;
    preferredChannels: string[];
    mqttConfig: {
        brokerUrl?: string;
        username?: string;
        password?: string;
        clientId?: string;
        useTls?: boolean;
    };
    bleConfig: {
        advertisingName?: string;
        securityLevel?: string;
        autoReconnect?: boolean;
    };
    httpConfig: {
        baseUrl?: string;
        authToken?: string;
        pollingInterval?: number;
    };
    connectionTimeout: number;
    maxRetries: number;
    retryInterval: number;
    createdAt: Date;
    updatedAt: Date;
}
