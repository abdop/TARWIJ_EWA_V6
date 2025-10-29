/**
 * User Repository Interface
 * Abstraction layer for user data operations
 */

import type { UserRole } from "../../packages/shared/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: UserRole;
  entrepriseId?: string;
  hedera_id: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEnterprise(enterpriseId: string): Promise<User[]>;
  findByCategory(enterpriseId: string, category: string): Promise<User[]>;
  findByHederaId(hederaId: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User | undefined>;
  delete(id: string): Promise<boolean>;
}
