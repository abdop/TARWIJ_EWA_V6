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
    // Note: dataService doesn't have getAllUsers method yet
    // This would need to be implemented in dataService
    throw new Error("Get all users not implemented in dataService");
  }

  async create(user: User): Promise<User> {
    // Note: dataService doesn't have create method yet
    throw new Error("Create user not implemented in dataService");
  }

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Note: dataService doesn't have update method yet
    throw new Error("Update user not implemented in dataService");
  }

  async delete(id: string): Promise<boolean> {
    // Note: dataService doesn't have delete method yet
    throw new Error("Delete user not implemented in dataService");
  }
}

export const userRepository = new JsonUserRepository();
