/**
 * JSON File Implementation of Wage Advance Repository
 */

import {
  IWageAdvanceRepository,
  WageAdvanceRequest,
} from "../IWageAdvanceRepository";
import { dataService } from "../../services/data/dataService";

export class JsonWageAdvanceRepository implements IWageAdvanceRepository {
  async findById(id: string): Promise<WageAdvanceRequest | undefined> {
    return dataService.getWageAdvanceRequest(id);
  }

  async findByEmployee(employeeId: string): Promise<WageAdvanceRequest[]> {
    return dataService.getWageAdvanceRequestsByEmployee(employeeId);
  }

  async findByEnterprise(
    enterpriseId: string
  ): Promise<WageAdvanceRequest[]> {
    return dataService.getWageAdvanceRequestsByEnterprise(enterpriseId);
  }

  async findByStatus(status: string): Promise<WageAdvanceRequest[]> {
    return dataService.getWageAdvanceRequestsByStatus(status);
  }

  async findPendingByEmployee(
    employeeId: string
  ): Promise<WageAdvanceRequest[]> {
    const allRequests = await this.findByEmployee(employeeId);
    return allRequests.filter(
      (req) => req.status === "pending" || req.status === "pending_signature"
    );
  }

  async findAll(): Promise<WageAdvanceRequest[]> {
    return dataService.getAllWageAdvanceRequests();
  }

  async create(request: WageAdvanceRequest): Promise<WageAdvanceRequest> {
    // Pass the full request object including id to preserve it
    return dataService.createWageAdvanceRequest(request as any);
  }

  async update(
    id: string,
    updates: Partial<WageAdvanceRequest>
  ): Promise<WageAdvanceRequest | undefined> {
    return dataService.updateWageAdvanceRequest(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return dataService.deleteWageAdvanceRequest(id);
  }
}

export const wageAdvanceRepository = new JsonWageAdvanceRepository();
