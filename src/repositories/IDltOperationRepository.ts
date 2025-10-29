/**
 * DLT Operation Repository Interface
 * Abstraction layer for DLT operation data operations
 */

export interface DltOperation {
  type: string;
  status: string;
  userId: string;
  entrepriseId?: string;
  tokenId?: string;
  details: any;
  createdAt: string;
  id: string;
  transactionId?: string;
  completedAt?: string;
}

export interface IDltOperationRepository {
  findById(id: string): Promise<DltOperation | undefined>;
  findByEnterprise(enterpriseId: string): Promise<DltOperation[]>;
  findByToken(tokenId: string): Promise<DltOperation[]>;
  findByUser(userId: string): Promise<DltOperation[]>;
  findByType(type: string): Promise<DltOperation[]>;
  findByStatus(status: string): Promise<DltOperation[]>;
  findAll(): Promise<DltOperation[]>;
  create(operation: DltOperation): Promise<DltOperation>;
  update(id: string, updates: Partial<DltOperation>): Promise<DltOperation | undefined>;
  delete(id: string): Promise<boolean>;
}
