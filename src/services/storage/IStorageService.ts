/**
 * Storage Service Interface
 * Abstraction layer for data persistence
 * Allows switching between JSON, SQL, NoSQL, or other storage backends
 */

export interface IStorageService {
  // Generic CRUD operations
  findById<T>(collection: string, id: string): Promise<T | undefined>;
  findAll<T>(collection: string): Promise<T[]>;
  findOne<T>(collection: string, filter: Record<string, any>): Promise<T | undefined>;
  findMany<T>(collection: string, filter: Record<string, any>): Promise<T[]>;
  create<T>(collection: string, data: T): Promise<T>;
  update<T>(collection: string, id: string, updates: Partial<T>): Promise<T | undefined>;
  delete(collection: string, id: string): Promise<boolean>;
  
  // Utility methods
  generateId(prefix: string): string;
  clearCache?(): void;
}

export type StorageCollections = 
  | 'entreprises'
  | 'users'
  | 'entreprise_tokens'
  | 'dlt_operations'
  | 'wage_advance_requests';
