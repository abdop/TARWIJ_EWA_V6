/**
 * JSON File Implementation of Enterprise Repository
 */

import { IEnterpriseRepository, Enterprise } from "../IEnterpriseRepository";
import { dataService } from "../../services/data/dataService";

export class JsonEnterpriseRepository implements IEnterpriseRepository {
  async findById(id: string): Promise<Enterprise | undefined> {
    return dataService.getEnterprise(id);
  }

  async findAll(): Promise<Enterprise[]> {
    return dataService.getAllEnterprises();
  }

  async create(enterprise: Enterprise): Promise<Enterprise> {
    // Pass the full enterprise object including id to preserve it
    return dataService.createEnterprise(enterprise as any);
  }

  async update(
    id: string,
    updates: Partial<Enterprise>
  ): Promise<Enterprise | undefined> {
    return dataService.updateEnterprise(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return dataService.deleteEnterprise(id);
  }
}

export const enterpriseRepository = new JsonEnterpriseRepository();
