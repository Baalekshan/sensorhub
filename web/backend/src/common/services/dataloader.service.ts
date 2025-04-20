import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Repository } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class DataLoaderService {
  private loaders: Map<string, DataLoader<any, any>> = new Map();

  /**
   * Creates a batched dataloader for a TypeORM repository
   * @param repository The TypeORM repository
   * @param key The key field (usually 'id')
   * @param fieldName The name of the field for the dataloader key
   * @returns DataLoader instance
   */
  createLoader<T>(
    repository: Repository<T>,
    key = 'id' as keyof T,
    fieldName = key as keyof T,
  ): DataLoader<any, T> {
    const loaderName = `${repository.metadata.name}:${String(key)}`;

    if (this.loaders.has(loaderName)) {
      return this.loaders.get(loaderName);
    }

    const loader = new DataLoader<any, T>(async (keys: any[]) => {
      // Create a map of field name to key
      const fieldMap = {};
      keys.forEach(key => {
        fieldMap[fieldName] = key;
      });

      // Find all entities that match any of the keys
      const entities = await repository.find({
        where: keys.map(key => {
          const where = {};
          where[fieldName] = key;
          return where;
        }),
      });

      // Map entities to the order of the keys
      const entityMap = new Map<any, T>();
      entities.forEach(entity => {
        entityMap.set(entity[fieldName], entity);
      });

      return keys.map(key => entityMap.get(key) || null);
    });

    this.loaders.set(loaderName, loader);
    return loader;
  }

  /**
   * Creates a dataloader for many-to-one relations
   * @param repository The repository containing the entities with the foreign key
   * @param foreignKey The foreign key field
   * @param parentIdField The parent ID field (default: 'id')
   * @returns DataLoader instance
   */
  createManyToOneLoader<T, K extends keyof T>(
    repository: Repository<T>,
    foreignKey: K,
    parentIdField = 'id' as any,
  ): DataLoader<any, T[]> {
    const loaderName = `${repository.metadata.name}:${String(foreignKey)}:manyToOne`;

    if (this.loaders.has(loaderName)) {
      return this.loaders.get(loaderName);
    }

    const loader = new DataLoader<any, T[]>(async (parentIds: any[]) => {
      // Find all entities that match the parent IDs
      const entities = await repository.find({
        where: parentIds.map(id => {
          const where = {};
          where[foreignKey] = id;
          return where;
        }),
      });

      // Group by parent ID
      const entityMap = new Map<any, T[]>();
      parentIds.forEach(id => entityMap.set(id, []));

      entities.forEach(entity => {
        const parentId = entity[foreignKey];
        if (entityMap.has(parentId)) {
          entityMap.get(parentId).push(entity);
        }
      });

      return parentIds.map(id => entityMap.get(id) || []);
    });

    this.loaders.set(loaderName, loader);
    return loader;
  }

  /**
   * Clears all dataloaders
   */
  clearAll(): void {
    this.loaders.forEach(loader => loader.clearAll());
  }

  /**
   * Clears a specific dataloader
   * @param name Dataloader name
   */
  clear(name: string): void {
    if (this.loaders.has(name)) {
      this.loaders.get(name).clearAll();
    }
  }
} 