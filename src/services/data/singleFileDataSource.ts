import { promises as fs } from 'fs';
import path from 'path';
import { IDataSource } from './dataSource';

/**
 * Single File Data Source
 * Manages a collection within a single JSON file containing multiple collections
 */
export class SingleFileDataSource<T extends { id: string }> implements IDataSource<T> {
  private dataPath: string;
  private collectionName: string;
  private cache: { [key: string]: any } | null = null;
  private lastModified: number = 0;

  constructor(collectionName: string, fileName: string = 'data.json') {
    this.collectionName = collectionName;
    this.dataPath = path.join(process.cwd(), fileName);
  }

  private async loadData(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      this.cache = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading ${this.dataPath}:`, error);
      throw new Error(`Failed to load data: ${error}`);
    }
  }

  private async saveData(): Promise<void> {
    if (!this.cache) {
      throw new Error('No data to save');
    }
    try {
      await fs.writeFile(
        this.dataPath,
        JSON.stringify(this.cache, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error(`Error saving ${this.dataPath}:`, error);
      throw new Error(`Failed to save data: ${error}`);
    }
  }

  private async ensureDataLoaded(): Promise<void> {
    try {
      const stats = await fs.stat(this.dataPath);
      const fileModified = stats.mtimeMs;

      if (!this.cache || fileModified > this.lastModified) {
        await this.loadData();
        this.lastModified = fileModified;
      }
    } catch (error) {
      if (!this.cache) {
        await this.loadData();
      }
    }
  }

  private getCollection(): T[] {
    if (!this.cache || !this.cache[this.collectionName]) {
      return [];
    }
    return this.cache[this.collectionName] as T[];
  }

  private setCollection(items: T[]): void {
    if (!this.cache) {
      this.cache = {};
    }
    this.cache[this.collectionName] = items;
  }

  async getAll(): Promise<T[]> {
    await this.ensureDataLoaded();
    return this.getCollection();
  }

  async getById(id: string): Promise<T | undefined> {
    await this.ensureDataLoaded();
    const collection = this.getCollection();
    return collection.find((item) => item.id === id);
  }

  async create(item: Omit<T, 'id'> | T): Promise<T> {
    await this.ensureDataLoaded();

    // Check if id is already provided in the item
    const itemWithId = item as any;
    const id = itemWithId.id || Math.random().toString(36).substring(2, 15);
    const newItem = { ...item, id } as T;

    const collection = this.getCollection();
    collection.push(newItem);
    this.setCollection(collection);

    await this.saveData();
    return newItem;
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    await this.ensureDataLoaded();

    const collection = this.getCollection();
    const index = collection.findIndex((item) => item.id === id);

    if (index === -1) {
      return undefined;
    }

    collection[index] = { ...collection[index], ...updates, id };
    this.setCollection(collection);

    await this.saveData();
    return collection[index];
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureDataLoaded();

    const collection = this.getCollection();
    const index = collection.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    collection.splice(index, 1);
    this.setCollection(collection);

    await this.saveData();
    return true;
  }

  async query(predicate: (item: T) => boolean): Promise<T[]> {
    await this.ensureDataLoaded();
    const collection = this.getCollection();
    return collection.filter(predicate);
  }
}
