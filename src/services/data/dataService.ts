import { IDataSource } from "./dataSource";
import { SingleFileDataSource } from "./singleFileDataSource";

export interface Enterprise {
  id: string;
  name: string;
  symbol: string;
  address: string;
  contactEmail: string;
  industry: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: "ent_admin" | "decider" | "employee" | "platform_admin";
  entrepriseId: string;
  hedera_id: string;
}

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
  pauseKey?: string;
  freezeKey?: string;
  supplyKeyList?: string[];
  supplyKeyThreshold?: number;
}

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

export interface WageAdvanceRequest {
  id: string;
  employeeId: string;
  entrepriseId: string;
  tokenId: string;
  requestedAmount: number;
  status: "pending" | "pending_signature" | "approved" | "rejected" | "completed";
  scheduledTransactionId?: string;
  deleteKey?: string;
  memo?: string;
  deciderApprovals?: {
    deciderId: string;
    approved: boolean;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface DataStructure {
  entreprises: Enterprise[];
  users: User[];
  entreprise_tokens: EnterpriseToken[];
  dlt_operations: DltOperation[];
  wage_advance_requests: any[];
}

class DataService {
  // Data sources using abstraction layer
  private enterpriseDataSource: IDataSource<Enterprise>;
  private userDataSource: IDataSource<User>;
  private tokenDataSource: IDataSource<EnterpriseToken>;
  private dltOperationDataSource: IDataSource<DltOperation>;
  private wageAdvanceDataSource: IDataSource<WageAdvanceRequest>;

  constructor() {
    // Initialize with single file data sources using data.json
    // Each data source manages a different collection within the same file
    this.enterpriseDataSource = new SingleFileDataSource<Enterprise>("entreprises");
    this.userDataSource = new SingleFileDataSource<User>("users");
    this.tokenDataSource = new SingleFileDataSource<EnterpriseToken>("entreprise_tokens");
    this.dltOperationDataSource = new SingleFileDataSource<DltOperation>("dlt_operations");
    this.wageAdvanceDataSource = new SingleFileDataSource<WageAdvanceRequest>("wage_advance_requests");
  }

  // Enterprise methods
  async getEnterprise(id: string): Promise<Enterprise | undefined> {
    return this.enterpriseDataSource.getById(id);
  }

  async getAllEnterprises(): Promise<Enterprise[]> {
    return this.enterpriseDataSource.getAll();
  }

  async createEnterprise(enterprise: Omit<Enterprise, "id">): Promise<Enterprise> {
    return this.enterpriseDataSource.create(enterprise);
  }

  async updateEnterprise(id: string, updates: Partial<Enterprise>): Promise<Enterprise | undefined> {
    return this.enterpriseDataSource.update(id, updates);
  }

  async deleteEnterprise(id: string): Promise<boolean> {
    return this.enterpriseDataSource.delete(id);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.userDataSource.getById(id);
  }

  async getUsersByEnterprise(enterpriseId: string): Promise<User[]> {
    return this.userDataSource.query((u) => u.entrepriseId === enterpriseId);
  }

  async getUsersByCategory(
    enterpriseId: string,
    category: string
  ): Promise<User[]> {
    return this.userDataSource.query(
      (u) => u.entrepriseId === enterpriseId && u.category === category
    );
  }

  async createUser(user: Omit<User, "id">): Promise<User> {
    return this.userDataSource.create(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return this.userDataSource.update(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userDataSource.delete(id);
  }

  async getUserByHederaId(hederaId: string): Promise<User | undefined> {
    const users = await this.userDataSource.query((u) => u.hedera_id === hederaId);
    return users[0];
  }

  async getAllUsers(): Promise<User[]> {
    return this.userDataSource.getAll();
  }

  // Enterprise Token methods
  async createEnterpriseToken(
    token: Omit<EnterpriseToken, "id">
  ): Promise<EnterpriseToken> {
    return this.tokenDataSource.create(token);
  }

  async getEnterpriseToken(
    tokenId: string
  ): Promise<EnterpriseToken | undefined> {
    const tokens = await this.tokenDataSource.query((t) => t.tokenId === tokenId);
    return tokens[0];
  }

  async getEnterpriseTokenByEnterpriseId(
    enterpriseId: string
  ): Promise<EnterpriseToken | undefined> {
    const tokens = await this.tokenDataSource.query(
      (t) => t.entrepriseId === enterpriseId
    );
    return tokens[0];
  }

  async updateEnterpriseToken(
    id: string,
    updates: Partial<EnterpriseToken>
  ): Promise<EnterpriseToken | undefined> {
    return this.tokenDataSource.update(id, updates);
  }

  async deleteEnterpriseToken(id: string): Promise<boolean> {
    return this.tokenDataSource.delete(id);
  }

  async getAllEnterpriseTokens(): Promise<EnterpriseToken[]> {
    return this.tokenDataSource.getAll();
  }

  // DLT Operation methods
  async createDltOperation(operation: Omit<DltOperation, "id">): Promise<DltOperation> {
    return this.dltOperationDataSource.create(operation);
  }

  async updateDltOperation(
    id: string,
    updates: Partial<DltOperation>
  ): Promise<DltOperation | undefined> {
    return this.dltOperationDataSource.update(id, updates);
  }

  async getDltOperationsByEnterprise(
    enterpriseId: string
  ): Promise<DltOperation[]> {
    return this.dltOperationDataSource.query(
      (op) => op.entrepriseId === enterpriseId
    );
  }

  async getAllDltOperations(): Promise<DltOperation[]> {
    return this.dltOperationDataSource.getAll();
  }

  async getDltOperation(id: string): Promise<DltOperation | undefined> {
    return this.dltOperationDataSource.getById(id);
  }

  async getDltOperationsByToken(tokenId: string): Promise<DltOperation[]> {
    return this.dltOperationDataSource.query((op) => op.tokenId === tokenId);
  }

  async getDltOperationsByUser(userId: string): Promise<DltOperation[]> {
    return this.dltOperationDataSource.query((op) => op.userId === userId);
  }

  async getDltOperationsByType(type: string): Promise<DltOperation[]> {
    return this.dltOperationDataSource.query((op) => op.type === type);
  }

  async deleteDltOperation(id: string): Promise<boolean> {
    return this.dltOperationDataSource.delete(id);
  }

  // Wage Advance Request methods
  async createWageAdvanceRequest(
    request: Omit<WageAdvanceRequest, "id">
  ): Promise<WageAdvanceRequest> {
    return this.wageAdvanceDataSource.create(request);
  }

  async getWageAdvanceRequest(
    id: string
  ): Promise<WageAdvanceRequest | undefined> {
    return this.wageAdvanceDataSource.getById(id);
  }

  async getWageAdvanceRequestsByEmployee(
    employeeId: string
  ): Promise<WageAdvanceRequest[]> {
    return this.wageAdvanceDataSource.query(
      (req) => req.employeeId === employeeId
    );
  }

  async getWageAdvanceRequestsByEnterprise(
    enterpriseId: string
  ): Promise<WageAdvanceRequest[]> {
    return this.wageAdvanceDataSource.query(
      (req) => req.entrepriseId === enterpriseId
    );
  }

  async getWageAdvanceRequestsByStatus(
    status: string
  ): Promise<WageAdvanceRequest[]> {
    return this.wageAdvanceDataSource.query(
      (req) => req.status === status
    );
  }

  async getAllWageAdvanceRequests(): Promise<WageAdvanceRequest[]> {
    return this.wageAdvanceDataSource.getAll();
  }

  async updateWageAdvanceRequest(
    id: string,
    updates: Partial<WageAdvanceRequest>
  ): Promise<WageAdvanceRequest | undefined> {
    const updatedRequest = await this.wageAdvanceDataSource.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return updatedRequest;
  }

  async deleteWageAdvanceRequest(id: string): Promise<boolean> {
    return this.wageAdvanceDataSource.delete(id);
  }

  // Generate unique ID
  generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${timestamp}_${random}`;
  }
}

export const dataService = new DataService();
