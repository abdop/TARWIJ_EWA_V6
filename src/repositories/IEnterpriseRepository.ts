/**
 * Enterprise Repository Interface
 * Abstraction layer for enterprise data operations
 */

export interface Enterprise {
  id: string;
  name: string;
  symbol: string;
  address: string;
  contactEmail: string;
  industry: string;
}

export interface IEnterpriseRepository {
  findById(id: string): Promise<Enterprise | undefined>;
  findAll(): Promise<Enterprise[]>;
  create(enterprise: Enterprise): Promise<Enterprise>;
  update(id: string, updates: Partial<Enterprise>): Promise<Enterprise | undefined>;
  delete(id: string): Promise<boolean>;
}
