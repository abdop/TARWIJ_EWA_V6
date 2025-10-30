/**
 * Wage Advance Service
 * Handles the complete workflow for wage advance requests
 */

import {
  PrivateKey,
  AccountId,
  TokenId,
  TokenMintTransaction,
  TransferTransaction,
  ScheduleCreateTransaction,
  ScheduleSignTransaction,
  ScheduleDeleteTransaction,
  ScheduleInfoQuery,
  TokenAssociateTransaction,
  Hbar,
  Timestamp,
} from "@hashgraph/sdk";
import { hederaClient } from "../hedera/client";
import { keyManagementService } from "../hedera/keyManagement";
import {
  getUserRepository,
  getEnterpriseTokenRepository,
  getDltOperationRepository,
  getWageAdvanceRepository,
} from "../../repositories/RepositoryFactory";
import { WageAdvanceRequest } from "../../repositories/IWageAdvanceRepository";
import { emailService } from "../notifications/emailService";
import { dataService } from "../data/dataService";

export interface WageAdvanceRequestInput {
  employeeId: string;
  requestedAmount: number;
}

export interface DeciderApproval {
  deciderId: string;
  approved: boolean;
  privateKey: string;
}

export class WageAdvanceService {
  /**
   * Step 1: Employee requests wage advance
   */
  async requestWageAdvance(
    input: WageAdvanceRequestInput
  ): Promise<WageAdvanceRequest> {
    const userRepo = getUserRepository();
    const tokenRepo = getEnterpriseTokenRepository();
    const wageAdvanceRepo = getWageAdvanceRepository();
    const dltOpRepo = getDltOperationRepository();

    // Get employee
    const employee = await userRepo.findById(input.employeeId);
    if (!employee) {
      throw new Error(`Employee ${input.employeeId} not found`);
    }

    if (employee.category !== "employee") {
      throw new Error("Only employees can request wage advances");
    }

    // Check for pending requests
    const pendingRequests = await wageAdvanceRepo.findPendingByEmployee(
      input.employeeId
    );
    if (pendingRequests.length > 0) {
      throw new Error(
        "Employee already has a pending wage advance request. Only one request can be pending at a time."
      );
    }

    // Get enterprise token
    const token = await tokenRepo.findByEnterpriseId(employee.entrepriseId);
    if (!token) {
      throw new Error(`No token found for enterprise ${employee.entrepriseId}`);
    }

    // Create wage advance request
    const request: WageAdvanceRequest = {
      id: dataService.generateId("wage_adv"),
      employeeId: input.employeeId,
      entrepriseId: employee.entrepriseId,
      tokenId: token.tokenId,
      requestedAmount: input.requestedAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdRequest = await wageAdvanceRepo.create(request);

    // Log operation
    await dltOpRepo.create({
      type: "WAGE_ADVANCE_REQUEST_CREATED",
      status: "SUCCESS",
      userId: input.employeeId,
      entrepriseId: employee.entrepriseId,
      tokenId: token.tokenId,
      details: {
        requestId: request.id,
        requestedAmount: input.requestedAmount,
        employeeName: employee.name,
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      completedAt: new Date().toISOString(),
    });

    console.log(`✓ Wage advance request created: ${request.id}`);
    console.log(`  Employee: ${employee.name}`);
    console.log(`  Amount: ${input.requestedAmount} tokens`);
    console.log(`  Status: ${request.status}\n`);

    return createdRequest;
  }

  /**
   * Step 2: Check and associate token with employee account
   */
  async ensureTokenAssociation(
    requestId: string,
    employeePrivateKey: string
  ): Promise<boolean> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    const userRepo = getUserRepository();
    const dltOpRepo = getDltOperationRepository();
    const client = hederaClient.getClient();

    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const employee = await userRepo.findById(request.employeeId);
    if (!employee) {
      throw new Error(`Employee ${request.employeeId} not found`);
    }

    const employeeKey = PrivateKey.fromString(employeePrivateKey);
    const employeeAccountId = AccountId.fromString(employee.hedera_id);
    const tokenId = TokenId.fromString(request.tokenId);

    try {
      // Associate token with employee account
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(employeeAccountId)
        .setTokenIds([tokenId])
        .freezeWith(client);

      const signedTx = await associateTx.sign(employeeKey);
      const txResponse = await signedTx.execute(client);
      const receipt = await txResponse.getReceipt(client);

      // Log operation
      await dltOpRepo.create({
        type: "TOKEN_ASSOCIATE",
        status: "SUCCESS",
        userId: request.employeeId,
        entrepriseId: request.entrepriseId,
        tokenId: request.tokenId,
        details: {
          requestId: request.id,
          accountId: employee.hedera_id,
          transactionId: txResponse.transactionId.toString(),
        },
        createdAt: new Date().toISOString(),
        id: dataService.generateId("dlt"),
        transactionId: txResponse.transactionId.toString(),
        completedAt: new Date().toISOString(),
      });

      console.log(`✓ Token associated with employee account`);
      console.log(`  Account: ${employee.hedera_id}`);
      console.log(`  Token: ${request.tokenId}`);
      console.log(`  Transaction: ${txResponse.transactionId.toString()}\n`);

      return true;
    } catch (error: any) {
      // Token might already be associated
      if (error.message && error.message.includes("TOKEN_ALREADY_ASSOCIATED")) {
        console.log(`✓ Token already associated with employee account\n`);
        return true;
      }
      throw error;
    }
  }

  /**
   * Step 3: Create scheduled mint transaction
   */
  async createScheduledMint(
    requestId: string,
    expirationHoursDelay = 72
  ): Promise<{ scheduleId: string; transactionId: string }> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    const tokenRepo = getEnterpriseTokenRepository();
    const userRepo = getUserRepository();
    const dltOpRepo = getDltOperationRepository();
    const client = hederaClient.getClient();

    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status !== "pending") {
      throw new Error(
        `Request must be in pending status. Current status: ${request.status}`
      );
    }

    const token = await tokenRepo.findByTokenId(request.tokenId);
    if (!token) {
      throw new Error(`Token ${request.tokenId} not found`);
    }

    // Get deciders
    const deciders = await userRepo.findByCategory(
      request.entrepriseId,
      "decider"
    );
    if (deciders.length === 0) {
      throw new Error("No deciders found for enterprise");
    }

    // Use generated public key as admin key (for deletion capability)

    const deleteKey = PrivateKey.generateED25519();
    const adminKey = deleteKey.publicKey;
    console.log("Delete key: ", deleteKey.toString());
    console.log("Admin key: ", adminKey.toString());

    // Create mint transaction
    const mintTx = new TokenMintTransaction()
      .setTokenId(request.tokenId)
      .setAmount(request.requestedAmount);

    // Create schedule transaction - signatures will be collected via ScheduleSignTransaction
    const scheduleTransaction = await (
      await new ScheduleCreateTransaction()
        .setScheduledTransaction(mintTx)
        .setAdminKey(adminKey) // ← Using generated public key
        .setPayerAccountId(client.operatorAccountId!)
        .setScheduleMemo(`wage_advance:${request.id}`)
        .setExpirationTime(
          new Timestamp(
            Math.floor(
              (Date.now() + expirationHoursDelay * 60 * 60 * 1000) / 1000
            ),
            0
          )
        )
        .freezeWith(client)
        .sign(deleteKey)
    ).execute(client);

    const receipt = await scheduleTransaction.getReceipt(client);
    const scheduledTransactionId = receipt.scheduleId;
    const scheduledTxId = receipt.scheduledTransactionId;

    if (!scheduledTransactionId) {
      throw new Error("Failed to create scheduled transaction");
    }

    // Update request
    await wageAdvanceRepo.update(request.id, {
      status: "pending_signature",
      scheduledTransactionId: scheduledTransactionId.toString(),
      deleteKey: deleteKey.toString(), // Store operator key for deletion
      memo: `wage_advance:${request.id}`,
      deciderApprovals: [], // No signatures yet - all will sign via ScheduleSignTransaction
    });

    // Log operation
    await dltOpRepo.create({
      type: "SCHEDULED_MINT_CREATED",
      status: "SUCCESS",
      userId: request.employeeId,
      entrepriseId: request.entrepriseId,
      tokenId: request.tokenId,
      details: {
        requestId: request.id,
        scheduledTransactionId: scheduledTransactionId.toString(),
        amount: request.requestedAmount,
        expirationTime: new Date(
          Date.now() + expirationHoursDelay * 60 * 60 * 1000
        ).toISOString(),
        requiredSignatures: deciders.length,
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: scheduleTransaction.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    console.log(`✓ Scheduled mint transaction created`);
    console.log(`  Schedule ID: ${scheduledTransactionId.toString()}`);
    console.log(`  Transaction ID: ${scheduleTransaction.transactionId.toString()}`);
    console.log(`  Amount: ${request.requestedAmount} tokens`);
    console.log(`  Required signatures: ${deciders.length}\n`);

    // Notify all deciders
    if (deciders.length > 0) {
      const employee = await userRepo.findById(request.employeeId);
      await emailService.notifyDecidersForApproval(
        deciders.map((d) => d.email),
        employee!.name,
        request.requestedAmount,
        request.id,
        scheduledTransactionId.toString()
      );
    }

    return {
      scheduleId: scheduledTransactionId.toString(),
      transactionId: scheduleTransaction.transactionId.toString(),
    };
  }

  /**
   * Step 4: Decider approves or rejects the request
   */
  async processDeciderDecision(
    requestId: string,
    deciderId: string,
    approved: boolean,
    deciderPrivateKey: string,
    rejectionReason?: string
  ): Promise<void> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    const userRepo = getUserRepository();
    const dltOpRepo = getDltOperationRepository();
    const client = hederaClient.getClient();

    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status !== "pending_signature") {
      throw new Error(
        `Request must be in pending_signature status. Current status: ${request.status}`
      );
    }

    const decider = await userRepo.findById(deciderId);
    if (!decider || decider.category !== "decider") {
      throw new Error(`Invalid decider: ${deciderId}`);
    }

    // Check if decider already voted
    const existingApproval = request.deciderApprovals?.find(
      (a) => a.deciderId === deciderId
    );
    if (existingApproval) {
      throw new Error("Decider has already voted on this request");
    }

    if (approved) {
      // Sign the scheduled transaction
      const deciderKey = PrivateKey.fromString(deciderPrivateKey);
      const scheduleSignTx = new ScheduleSignTransaction()
        .setScheduleId(request.scheduledTransactionId!)
        .freezeWith(client);

      const signedTx = await scheduleSignTx.sign(deciderKey);
      const txResponse = await signedTx.execute(client);
      const receipt = await txResponse.getReceipt(client);

      // Update approvals
      const updatedApprovals = [
        ...(request.deciderApprovals || []),
        {
          deciderId: deciderId,
          approved: true,
          timestamp: new Date().toISOString(),
        },
      ];

      await wageAdvanceRepo.update(request.id, {
        deciderApprovals: updatedApprovals,
      });

      // Log operation
      await dltOpRepo.create({
        type: "SCHEDULED_MINT_APPROVED",
        status: "SUCCESS",
        userId: deciderId,
        entrepriseId: request.entrepriseId,
        tokenId: request.tokenId,
        details: {
          requestId: request.id,
          scheduledTransactionId: request.scheduledTransactionId,
          deciderId: deciderId,
          deciderName: decider.name,
          transactionId: txResponse.transactionId.toString(),
        },
        createdAt: new Date().toISOString(),
        id: dataService.generateId("dlt"),
        transactionId: txResponse.transactionId.toString(),
        completedAt: new Date().toISOString(),
      });

      console.log(`✓ Decider approved the request`);
      console.log(`  Decider: ${decider.name}`);
      console.log(`  Request: ${request.id}`);
      console.log(`  Approvals: ${updatedApprovals.length}\n`);

      // Check if all deciders have approved
      const allDeciders = await userRepo.findByCategory(
        request.entrepriseId,
        "decider"
      );
      if (updatedApprovals.length === allDeciders.length) {
        console.log(`✓ All deciders have approved! Processing transfer...\n`);
        await this.executeTransfer(requestId);
      }
    } else {
      // Reject: Delete the scheduled transaction
      const deleteKey = PrivateKey.fromString(request.deleteKey!);
      const scheduleDeleteTx = new ScheduleDeleteTransaction()
        .setScheduleId(request.scheduledTransactionId!)
        .freezeWith(client);

      const signedTx = await scheduleDeleteTx.sign(deleteKey);
      const txResponse = await signedTx.execute(client);
      await txResponse.getReceipt(client);

      // Update request
      await wageAdvanceRepo.update(request.id, {
        status: "rejected",
        rejectedBy: deciderId,
        rejectionReason: rejectionReason,
        completedAt: new Date().toISOString(),
      });

      // Log operation
      await dltOpRepo.create({
        type: "SCHEDULED_MINT_REJECTED",
        status: "SUCCESS",
        userId: deciderId,
        entrepriseId: request.entrepriseId,
        tokenId: request.tokenId,
        details: {
          requestId: request.id,
          scheduledTransactionId: request.scheduledTransactionId,
          deciderId: deciderId,
          deciderName: decider.name,
          rejectionReason: rejectionReason,
          transactionId: txResponse.transactionId.toString(),
        },
        createdAt: new Date().toISOString(),
        id: dataService.generateId("dlt"),
        transactionId: txResponse.transactionId.toString(),
        completedAt: new Date().toISOString(),
      });

      console.log(`✗ Decider rejected the request`);
      console.log(`  Decider: ${decider.name}`);
      console.log(`  Request: ${request.id}`);
      console.log(`  Reason: ${rejectionReason || "Not specified"}\n`);

      // Notify employee
      const employee = await userRepo.findById(request.employeeId);
      await emailService.notifyEmployeeRejected(
        employee!.email,
        employee!.name,
        request.requestedAmount,
        request.id,
        decider.name,
        rejectionReason
      );
    }
  }

  /**
   * Step 5: Execute transfer after all approvals
   */
  async executeTransfer(requestId: string): Promise<void> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    const userRepo = getUserRepository();
    const tokenRepo = getEnterpriseTokenRepository();
    const dltOpRepo = getDltOperationRepository();
    const client = hederaClient.getClient();

    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const employee = await userRepo.findById(request.employeeId);
    if (!employee) {
      throw new Error(`Employee ${request.employeeId} not found`);
    }

    const token = await tokenRepo.findByTokenId(request.tokenId);
    if (!token) {
      throw new Error(`Token ${request.tokenId} not found`);
    }

    // Wait a bit for the scheduled transaction to execute
    console.log(`Waiting for scheduled mint to execute...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Transfer tokens to employee
    const treasuryKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);
    const transferTx = new TransferTransaction()
      .addTokenTransfer(
        request.tokenId,
        token.treasuryAccountId,
        -request.requestedAmount
      )
      .addTokenTransfer(
        request.tokenId,
        employee.hedera_id,
        request.requestedAmount
      )
      .setTransactionMemo(
        `wage_advance:${request.id}:${request.scheduledTransactionId}`
      )
      .freezeWith(client);

    const signedTx = await transferTx.sign(treasuryKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Update request
    await wageAdvanceRepo.update(request.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    // Log operation
    await dltOpRepo.create({
      type: "WAGE_ADVANCE_TRANSFER_COMPLETED",
      status: "SUCCESS",
      userId: request.employeeId,
      entrepriseId: request.entrepriseId,
      tokenId: request.tokenId,
      details: {
        requestId: request.id,
        amount: request.requestedAmount,
        fromAccount: token.treasuryAccountId,
        toAccount: employee.hedera_id,
        transactionId: txResponse.transactionId.toString(),
        scheduledTransactionId: request.scheduledTransactionId,
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    console.log(`✓ Tokens transferred to employee`);
    console.log(`  Amount: ${request.requestedAmount} tokens`);
    console.log(`  To: ${employee.hedera_id}`);
    console.log(`  Transaction: ${txResponse.transactionId.toString()}\n`);

    // Notify employee
    await emailService.notifyEmployeeTransferCompleted(
      employee.email,
      employee.name,
      request.requestedAmount,
      txResponse.transactionId.toString()
    );

    await emailService.notifyEmployeeApproved(
      employee.email,
      employee.name,
      request.requestedAmount,
      request.id
    );
  }

  /**
   * Get request status
   */
  async getRequestStatus(requestId: string): Promise<WageAdvanceRequest> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }
    return request;
  }

  /**
   * Get all requests for an employee
   */
  async getEmployeeRequests(employeeId: string): Promise<WageAdvanceRequest[]> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    return wageAdvanceRepo.findByEmployee(employeeId);
  }

  /**
   * Get all pending requests for an enterprise
   */
  async getPendingRequests(
    enterpriseId: string
  ): Promise<WageAdvanceRequest[]> {
    const wageAdvanceRepo = getWageAdvanceRepository();
    const allRequests = await wageAdvanceRepo.findByEnterprise(enterpriseId);
    return allRequests.filter((r) => r.status === "pending_signature");
  }
}

export const wageAdvanceService = new WageAdvanceService();
