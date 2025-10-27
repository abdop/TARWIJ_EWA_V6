/**
 * User Repository Interface
 * Abstraction layer for user data operations
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: "ent_admin" | "decider" | "employee";
  entrepriseId: string;
  hedera_id: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEnterprise(enterpriseId: string): Promise<User[]>;
  findByCategory(enterpriseId: string, category: string): Promise<User[]>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User | undefined>;
  delete(id: string): Promise<boolean>;
}
