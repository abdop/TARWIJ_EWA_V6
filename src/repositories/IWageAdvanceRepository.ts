/**
 * Wage Advance Repository Interface
 * Abstraction layer for wage advance request data operations
 */

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

export interface IWageAdvanceRepository {
  findById(id: string): Promise<WageAdvanceRequest | undefined>;
  findByEmployee(employeeId: string): Promise<WageAdvanceRequest[]>;
  findByEnterprise(enterpriseId: string): Promise<WageAdvanceRequest[]>;
  findByStatus(status: string): Promise<WageAdvanceRequest[]>;
  findPendingByEmployee(employeeId: string): Promise<WageAdvanceRequest[]>;
  findAll(): Promise<WageAdvanceRequest[]>;
  create(request: WageAdvanceRequest): Promise<WageAdvanceRequest>;
  update(
    id: string,
    updates: Partial<WageAdvanceRequest>
  ): Promise<WageAdvanceRequest | undefined>;
  delete(id: string): Promise<boolean>;
}
