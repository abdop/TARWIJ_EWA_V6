/**
 * JSON File Implementation of Enterprise Token Repository
 */

import {
  IEnterpriseTokenRepository,
  EnterpriseToken,
} from "../IEnterpriseTokenRepository";
import { dataService } from "../../services/data/dataService";

export class JsonEnterpriseTokenRepository
  implements IEnterpriseTokenRepository
{
  async findById(id: string): Promise<EnterpriseToken | undefined> {
    // Note: dataService uses tokenId, not internal id
    // This would need clarification
    throw new Error("Find by internal ID not implemented");
  }

  async findByTokenId(tokenId: string): Promise<EnterpriseToken | undefined> {
    return dataService.getEnterpriseToken(tokenId);
  }

  async findByEnterpriseId(
    enterpriseId: string
  ): Promise<EnterpriseToken | undefined> {
    return dataService.getEnterpriseTokenByEnterpriseId(enterpriseId);
  }

  async findAll(): Promise<EnterpriseToken[]> {
    // Note: dataService doesn't have getAllTokens method yet
    throw new Error("Get all tokens not implemented in dataService");
  }

  async create(token: EnterpriseToken): Promise<EnterpriseToken> {
    return dataService.createEnterpriseToken(token);
  }

  async update(
    tokenId: string,
    updates: Partial<EnterpriseToken>
  ): Promise<EnterpriseToken | undefined> {
    return dataService.updateEnterpriseToken(tokenId, updates);
  }

  async delete(tokenId: string): Promise<boolean> {
    // Note: dataService doesn't have delete method yet
    throw new Error("Delete token not implemented in dataService");
  }
}

export const enterpriseTokenRepository = new JsonEnterpriseTokenRepository();
