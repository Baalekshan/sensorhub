export declare class SensorProtocol {
    id: string;
    name: string;
    version: string;
    manufacturer: string;
    description: string;
    schema: {
        properties?: Record<string, any>;
        required?: string[];
        communication?: {
            busType: 'i2c' | 'spi' | 'uart' | 'digital' | 'analog' | 'onewire';
            i2c?: {
                defaultAddress?: string;
                addressRange?: string[];
                speedModes?: string[];
            };
            spi?: {
                maxSpeed?: number;
                mode?: number;
                bitOrder?: string;
            };
            uart?: {
                baudRate?: number;
                dataBits?: number;
                parity?: string;
                stopBits?: number;
            };
            digital?: {
                activeLow?: boolean;
                pullUp?: boolean;
            };
            analog?: {
                minVoltage?: number;
                maxVoltage?: number;
                resolution?: number;
            };
        };
        dataFormat?: {
            readings?: {
                type: string;
                unit: string;
                minValue?: number;
                maxValue?: number;
                precision?: number;
            }[];
        };
        commands?: Record<string, any>[];
    };
    defaultConfig: Record<string, any>;
    calibrationMethods: {
        method: string;
        parameters: Record<string, any>;
        description: string;
    }[];
    documentationUrl: string;
    published: boolean;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
