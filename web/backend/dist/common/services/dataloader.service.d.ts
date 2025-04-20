import DataLoader from 'dataloader';
import { Repository } from 'typeorm';
export declare class DataLoaderService {
    private loaders;
    createLoader<T>(repository: Repository<T>, key?: keyof T, fieldName?: keyof T): DataLoader<any, T>;
    createManyToOneLoader<T, K extends keyof T>(repository: Repository<T>, foreignKey: K, parentIdField?: any): DataLoader<any, T[]>;
    clearAll(): void;
    clear(name: string): void;
}
