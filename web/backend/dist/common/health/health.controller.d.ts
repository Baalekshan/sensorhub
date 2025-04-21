import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(): Promise<{
        status: string;
        timestamp: string;
        database: {
            status: string;
            error?: undefined;
        } | {
            status: string;
            error: string;
        };
        redis: {
            status: string;
            error?: undefined;
        } | {
            status: string;
            error: string;
        };
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
    }>;
}
