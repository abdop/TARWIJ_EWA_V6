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
    const tokens = await dataService.getAllEnterpriseTokens();
    return tokens.find((t: EnterpriseToken) => t.id === id);
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
    return dataService.getAllEnterpriseTokens();
  }

  async create(token: EnterpriseToken): Promise<EnterpriseToken> {
    // Pass the full token object including id to preserve it
    return dataService.createEnterpriseToken(token as any);
  }

  async update(
    tokenId: string,
    updates: Partial<EnterpriseToken>
  ): Promise<EnterpriseToken | undefined> {
    return dataService.updateEnterpriseToken(tokenId, updates);
  }

  async delete(tokenId: string): Promise<boolean> {
    // Find token by tokenId first to get internal id
    const token = await dataService.getEnterpriseToken(tokenId);
    if (!token) return false;
    return dataService.deleteEnterpriseToken(token.id);
  }
}

export const enterpriseTokenRepository = new JsonEnterpriseTokenRepository();
