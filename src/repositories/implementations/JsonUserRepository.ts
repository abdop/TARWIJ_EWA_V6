/**
 * JSON File Implementation of User Repository
 */

import { IUserRepository, User } from "../IUserRepository";
import { dataService } from "../../services/data/dataService";

export class JsonUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | undefined> {
    return dataService.getUser(id);
  }

  async findByEnterprise(enterpriseId: string): Promise<User[]> {
    return dataService.getUsersByEnterprise(enterpriseId);
  }

  async findByCategory(
    enterpriseId: string,
    category: string
  ): Promise<User[]> {
    return dataService.getUsersByCategory(enterpriseId, category);
  }

  async findAll(): Promise<User[]> {
    return dataService.getAllUsers();
  }

  async create(user: User): Promise<User> {
    // Pass the full user object including id to preserve it
    return dataService.createUser(user as any);
  }

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    return dataService.updateUser(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return dataService.deleteUser(id);
  }
}

export const userRepository = new JsonUserRepository();
