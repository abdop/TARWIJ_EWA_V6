/**
 * Enterprise Token Repository Interface
 * Abstraction layer for enterprise token data operations
 */

export interface EnterpriseToken {
  entrepriseId: string;
  tokenId: string;
  symbol: string;
  name: string;
  totalSupply: string;
  decimals: number;
  treasuryAccountId: string;
  adminAccountId: string;
  supplyAccountId?: string;
  feeCollectorAccountId: string;
  fractionalFee: number;
  createdAt: string;
  transactionId: string;
  id: string;
  wipeKey?: string;
  feeKey?: string;
  deleteKey?: string;
  freezeKey?: string;
  pauseKey?: string;
  supplyKeyList?: string[];
  supplyKeyThreshold?: number;
}

export interface IEnterpriseTokenRepository {
  findById(id: string): Promise<EnterpriseToken | undefined>;
  findByTokenId(tokenId: string): Promise<EnterpriseToken | undefined>;
  findByEnterpriseId(enterpriseId: string): Promise<EnterpriseToken | undefined>;
  findAll(): Promise<EnterpriseToken[]>;
  create(token: EnterpriseToken): Promise<EnterpriseToken>;
  update(tokenId: string, updates: Partial<EnterpriseToken>): Promise<EnterpriseToken | undefined>;
  delete(tokenId: string): Promise<boolean>;
}
