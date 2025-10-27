/**
 * JSON File Implementation of DLT Operation Repository
 */

import {
  IDltOperationRepository,
  DltOperation,
} from "../IDltOperationRepository";
import { dataService } from "../../services/data/dataService";

export class JsonDltOperationRepository implements IDltOperationRepository {
  async findById(id: string): Promise<DltOperation | undefined> {
    return dataService.getDltOperation(id);
  }

  async findByEnterprise(enterpriseId: string): Promise<DltOperation[]> {
    return dataService.getDltOperationsByEnterprise(enterpriseId);
  }

  async findByToken(tokenId: string): Promise<DltOperation[]> {
    return dataService.getDltOperationsByToken(tokenId);
  }

  async findByUser(userId: string): Promise<DltOperation[]> {
    return dataService.getDltOperationsByUser(userId);
  }

  async findByType(type: string): Promise<DltOperation[]> {
    return dataService.getDltOperationsByType(type);
  }

  async findAll(): Promise<DltOperation[]> {
    return dataService.getAllDltOperations();
  }

  async create(operation: DltOperation): Promise<DltOperation> {
    // Pass the full operation object including id to preserve it
    return dataService.createDltOperation(operation as any);
  }

  async update(
    id: string,
    updates: Partial<DltOperation>
  ): Promise<DltOperation | undefined> {
    return dataService.updateDltOperation(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return dataService.deleteDltOperation(id);
  }
}

export const dltOperationRepository = new JsonDltOperationRepository();
