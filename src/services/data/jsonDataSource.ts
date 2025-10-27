import { promises as fs } from 'fs';
import path from 'path';
import { IDataSource } from './dataSource';

interface JsonData<T> {
  [key: string]: T;
}

export class JsonDataSource<T extends { id: string }> implements IDataSource<T> {
  private dataPath: string;
  private data: JsonData<T> = {};
  private isInitialized = false;

  constructor(private fileName: string) {
    this.dataPath = path.join(process.cwd(), 'public', this.fileName);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await fs.access(this.dataPath);
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      this.data = JSON.parse(fileContent) || {};
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it with empty data
        await this.saveData();
      } else {
        console.error(`Error initializing JSON data source (${this.fileName}):`, error);
        throw new Error(`Failed to initialize data source: ${error.message}`);
      }
    }

    this.isInitialized = true;
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error saving data to ${this.fileName}:`, error);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  public async getAll(): Promise<T[]> {
    await this.ensureInitialized();
    return Object.values(this.data);
  }

  public async getById(id: string): Promise<T | undefined> {
    await this.ensureInitialized();
    return this.data[id];
  }

  public async create(item: Omit<T, 'id'>): Promise<T> {
    await this.ensureInitialized();
    
    const id = Math.random().toString(36).substring(2, 15);
    const newItem = { ...item, id } as T;
    
    this.data[id] = newItem;
    await this.saveData();
    
    return newItem;
  }

  public async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    await this.ensureInitialized();
    
    if (!this.data[id]) {
      return undefined;
    }
    
    this.data[id] = { ...this.data[id], ...updates, id };
    await this.saveData();
    
    return this.data[id];
  }

  public async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.data[id]) {
      return false;
    }
    
    delete this.data[id];
    await this.saveData();
    
    return true;
  }

  public async query(predicate: (item: T) => boolean): Promise<T[]> {
    await this.ensureInitialized();
    return Object.values(this.data).filter(predicate);
  }
}

// Example usage:
// const userDataSource = new JsonDataSource<User>('users.json');
