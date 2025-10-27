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
    // Note: dataService doesn't have create method yet
    // This would need to be implemented in dataService
    throw new Error("Create enterprise not implemented in dataService");
  }

  async update(
    id: string,
    updates: Partial<Enterprise>
  ): Promise<Enterprise | undefined> {
    // Note: dataService doesn't have update method yet
    // This would need to be implemented in dataService
    throw new Error("Update enterprise not implemented in dataService");
  }

  async delete(id: string): Promise<boolean> {
    // Note: dataService doesn't have delete method yet
    // This would need to be implemented in dataService
    throw new Error("Delete enterprise not implemented in dataService");
  }
}

export const enterpriseRepository = new JsonEnterpriseRepository();
