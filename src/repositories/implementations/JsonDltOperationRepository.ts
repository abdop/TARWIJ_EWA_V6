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
    // Note: dataService doesn't have getDltOperation method yet
    throw new Error("Find DLT operation by ID not implemented in dataService");
  }

  async findByEnterprise(enterpriseId: string): Promise<DltOperation[]> {
    return dataService.getDltOperationsByEnterprise(enterpriseId);
  }

  async findByToken(tokenId: string): Promise<DltOperation[]> {
    // Note: dataService doesn't have this method yet
    throw new Error("Find by token not implemented in dataService");
  }

  async findByUser(userId: string): Promise<DltOperation[]> {
    // Note: dataService doesn't have this method yet
    throw new Error("Find by user not implemented in dataService");
  }

  async findByType(type: string): Promise<DltOperation[]> {
    // Note: dataService doesn't have this method yet
    throw new Error("Find by type not implemented in dataService");
  }

  async findAll(): Promise<DltOperation[]> {
    // Note: dataService doesn't have getAllDltOperations method yet
    throw new Error("Get all operations not implemented in dataService");
  }

  async create(operation: DltOperation): Promise<DltOperation> {
    return dataService.createDltOperation(operation);
  }

  async update(
    id: string,
    updates: Partial<DltOperation>
  ): Promise<DltOperation | undefined> {
    return dataService.updateDltOperation(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    // Note: dataService doesn't have delete method yet
    throw new Error("Delete operation not implemented in dataService");
  }
}

export const dltOperationRepository = new JsonDltOperationRepository();
