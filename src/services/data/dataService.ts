import { promises as fs } from "fs";
import path from "path";

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
  category: "ent_admin" | "decider" | "employee";
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
  private dataPath: string;
  private data: DataStructure | null = null;
  private lastModified: number = 0;

  constructor() {
    this.dataPath = path.join(process.cwd(), "data.json");
  }

  private async loadData(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.dataPath, "utf-8");
      this.data = JSON.parse(fileContent);
    } catch (error) {
      console.error("Error loading data.json:", error);
      throw new Error(`Failed to load data: ${error}`);
    }
  }

  private async saveData(): Promise<void> {
    if (!this.data) {
      throw new Error("No data to save");
    }
    try {
      await fs.writeFile(
        this.dataPath,
        JSON.stringify(this.data, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error saving data.json:", error);
      throw new Error(`Failed to save data: ${error}`);
    }
  }

  private async ensureDataLoaded(): Promise<void> {
    try {
      // Check if file has been modified since last load
      const stats = await fs.stat(this.dataPath);
      const fileModified = stats.mtimeMs;
      
      // Reload if file changed or data not loaded
      if (!this.data || fileModified > this.lastModified) {
        await this.loadData();
        this.lastModified = fileModified;
      }
    } catch (error) {
      // If stat fails, try to load anyway
      if (!this.data) {
        await this.loadData();
      }
    }
  }

  // Public method to clear cache (useful for testing)
  public clearCache(): void {
    this.data = null;
  }

  // Enterprise methods
  async getEnterprise(id: string): Promise<Enterprise | undefined> {
    await this.ensureDataLoaded();
    return this.data!.entreprises.find((e) => e.id === id);
  }

  async getAllEnterprises(): Promise<Enterprise[]> {
    await this.ensureDataLoaded();
    return this.data!.entreprises;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureDataLoaded();
    return this.data!.users.find((u) => u.id === id);
  }

  async getUsersByEnterprise(enterpriseId: string): Promise<User[]> {
    await this.ensureDataLoaded();
    return this.data!.users.filter((u) => u.entrepriseId === enterpriseId);
  }

  async getUsersByCategory(
    enterpriseId: string,
    category: string
  ): Promise<User[]> {
    await this.ensureDataLoaded();
    return this.data!.users.filter(
      (u) => u.entrepriseId === enterpriseId && u.category === category
    );
  }

  // Enterprise Token methods
  async createEnterpriseToken(
    token: EnterpriseToken
  ): Promise<EnterpriseToken> {
    await this.ensureDataLoaded();
    this.data!.entreprise_tokens.push(token);
    await this.saveData();
    return token;
  }

  async getEnterpriseToken(
    tokenId: string
  ): Promise<EnterpriseToken | undefined> {
    await this.ensureDataLoaded();
    return this.data!.entreprise_tokens.find((t) => t.tokenId === tokenId);
  }

  async getEnterpriseTokenByEnterpriseId(
    enterpriseId: string
  ): Promise<EnterpriseToken | undefined> {
    await this.ensureDataLoaded();
    return this.data!.entreprise_tokens.find(
      (t) => t.entrepriseId === enterpriseId
    );
  }

  async updateEnterpriseToken(
    tokenId: string,
    updates: Partial<EnterpriseToken>
  ): Promise<EnterpriseToken | undefined> {
    await this.ensureDataLoaded();
    const index = this.data!.entreprise_tokens.findIndex(
      (t) => t.tokenId === tokenId
    );
    if (index === -1) {
      return undefined;
    }
    this.data!.entreprise_tokens[index] = {
      ...this.data!.entreprise_tokens[index],
      ...updates,
    };
    await this.saveData();
    return this.data!.entreprise_tokens[index];
  }

  // DLT Operation methods
  async createDltOperation(operation: DltOperation): Promise<DltOperation> {
    await this.ensureDataLoaded();
    this.data!.dlt_operations.push(operation);
    await this.saveData();
    return operation;
  }

  async updateDltOperation(
    id: string,
    updates: Partial<DltOperation>
  ): Promise<DltOperation | undefined> {
    await this.ensureDataLoaded();
    const index = this.data!.dlt_operations.findIndex((op) => op.id === id);
    if (index === -1) {
      return undefined;
    }
    this.data!.dlt_operations[index] = {
      ...this.data!.dlt_operations[index],
      ...updates,
    };
    await this.saveData();
    return this.data!.dlt_operations[index];
  }

  async getDltOperationsByEnterprise(
    enterpriseId: string
  ): Promise<DltOperation[]> {
    await this.ensureDataLoaded();
    return this.data!.dlt_operations.filter(
      (op) => op.entrepriseId === enterpriseId
    );
  }

  // Wage Advance Request methods
  async createWageAdvanceRequest(
    request: WageAdvanceRequest
  ): Promise<WageAdvanceRequest> {
    await this.ensureDataLoaded();
    this.data!.wage_advance_requests.push(request);
    await this.saveData();
    return request;
  }

  async getWageAdvanceRequest(
    id: string
  ): Promise<WageAdvanceRequest | undefined> {
    await this.ensureDataLoaded();
    return this.data!.wage_advance_requests.find((req) => req.id === id);
  }

  async getWageAdvanceRequestsByEmployee(
    employeeId: string
  ): Promise<WageAdvanceRequest[]> {
    await this.ensureDataLoaded();
    return this.data!.wage_advance_requests.filter(
      (req) => req.employeeId === employeeId
    );
  }

  async getWageAdvanceRequestsByEnterprise(
    enterpriseId: string
  ): Promise<WageAdvanceRequest[]> {
    await this.ensureDataLoaded();
    return this.data!.wage_advance_requests.filter(
      (req) => req.entrepriseId === enterpriseId
    );
  }

  async getWageAdvanceRequestsByStatus(
    status: string
  ): Promise<WageAdvanceRequest[]> {
    await this.ensureDataLoaded();
    return this.data!.wage_advance_requests.filter(
      (req) => req.status === status
    );
  }

  async getAllWageAdvanceRequests(): Promise<WageAdvanceRequest[]> {
    await this.ensureDataLoaded();
    return this.data!.wage_advance_requests;
  }

  async updateWageAdvanceRequest(
    id: string,
    updates: Partial<WageAdvanceRequest>
  ): Promise<WageAdvanceRequest | undefined> {
    await this.ensureDataLoaded();
    const index = this.data!.wage_advance_requests.findIndex(
      (req) => req.id === id
    );
    if (index === -1) {
      return undefined;
    }
    this.data!.wage_advance_requests[index] = {
      ...this.data!.wage_advance_requests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.saveData();
    return this.data!.wage_advance_requests[index];
  }

  async deleteWageAdvanceRequest(id: string): Promise<boolean> {
    await this.ensureDataLoaded();
    const index = this.data!.wage_advance_requests.findIndex(
      (req) => req.id === id
    );
    if (index === -1) {
      return false;
    }
    this.data!.wage_advance_requests.splice(index, 1);
    await this.saveData();
    return true;
  }

  // Generate unique ID
  generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${timestamp}_${random}`;
  }
}

export const dataService = new DataService();
