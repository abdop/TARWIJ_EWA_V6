/**
 * API Endpoint: Submit Decider Decision
 * POST /api/wage-advance/submit-decision
 * 
 * Called after decider signs the transaction with their wallet
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Transaction, ScheduleDeleteTransaction, PrivateKey } from '@hashgraph/sdk';
import { hederaClient } from '../../../src/services/hedera/client';
import { getWageAdvanceRepository, getUserRepository, getDltOperationRepository } from '../../../src/repositories/RepositoryFactory';
import { dataService } from '../../../src/services/data/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId, deciderId, approved, rejectionReason } = req.body;

    if (!requestId || !deciderId || approved === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Initialize Hedera client if not already initialized
    if (!hederaClient.isInitialized()) {
      hederaClient.initializeClient(
        process.env.HEDERA_OPERATOR_ID!,
        process.env.HEDERA_OPERATOR_KEY!,
        (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet') || 'testnet'
      );
    }

    const client = hederaClient.getClient();
    if (!client) {
      return res.status(500).json({ error: 'Failed to initialize Hedera client' });
    }
    const wageAdvanceRepo = getWageAdvanceRepository();
    const userRepo = getUserRepository();
    const dltOpRepo = getDltOperationRepository();

    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const decider = await userRepo.findById(deciderId);
    if (!decider || decider.category !== 'decider') {
      return res.status(403).json({ error: 'Invalid decider' });
    }

    // Check if decider already voted
    const existingApproval = request.deciderApprovals?.find(
      (a) => a.deciderId === deciderId
    );
    if (existingApproval) {
      return res.status(400).json({ error: 'Decider has already voted on this request' });
    }

    if (approved) {
      // Transaction already executed by wallet - just update database
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
        type: 'SCHEDULED_MINT_APPROVED',
        status: 'SUCCESS',
        userId: deciderId,
        entrepriseId: request.entrepriseId,
        tokenId: request.tokenId,
        details: {
          requestId: request.id,
          scheduledTransactionId: request.scheduledTransactionId,
          deciderId: deciderId,
          deciderName: decider.name,
        },
        createdAt: new Date().toISOString(),
        id: dataService.generateId('dlt'),
        completedAt: new Date().toISOString(),
      });

      // Check if all deciders have approved
      const allDeciders = await userRepo.findByCategory(
        request.entrepriseId,
        'decider'
      );

      if (updatedApprovals.length === allDeciders.length) {
        // All approved - trigger transfer
        // This will be handled by a background job or webhook
        // For now, we'll call it directly
        const { wageAdvanceService } = await import('../../../src/services/wageAdvance/wageAdvanceService');
        
        // Wait a bit for the scheduled transaction to execute
        setTimeout(async () => {
          try {
            await wageAdvanceService.executeTransfer(request.id);
          } catch (error) {
            console.error('Error executing transfer:', error);
          }
        }, 5000);
      }

      return res.status(200).json({
        success: true,
        action: 'approved',
        approvalsCount: updatedApprovals.length,
        requiredApprovals: allDeciders.length,
      });
    } else {
      // Rejection - execute ScheduleDelete with backend (wallet doesn't support it)
      if (!request.deleteKey) {
        return res.status(400).json({ 
          error: 'Delete key not found for scheduled transaction' 
        });
      }

      if (!request.scheduledTransactionId) {
        return res.status(400).json({ 
          error: 'No scheduled transaction found' 
        });
      }

      try {
        // Execute ScheduleDelete transaction with the delete key
        const deleteKey = PrivateKey.fromStringED25519(request.deleteKey);
        
        const scheduleDeleteTx = await new ScheduleDeleteTransaction()
          .setScheduleId(request.scheduledTransactionId)
          .freezeWith(client)
          .sign(deleteKey);

        const txResponse = await scheduleDeleteTx.execute(client);
        await txResponse.getReceipt(client);
        
        console.log(`Scheduled transaction ${request.scheduledTransactionId} deleted successfully`);
      } catch (error: any) {
        console.error('Error deleting scheduled transaction:', error);
        throw new Error(`Failed to delete scheduled transaction: ${error.message}`);
      }

      // Update request status
      await wageAdvanceRepo.update(request.id, {
        status: 'rejected',
        rejectionReason: rejectionReason || 'Rejected by decider',
        rejectedBy: deciderId,
      });

      // Log operation
      await dltOpRepo.create({
        type: 'SCHEDULED_MINT_REJECTED',
        status: 'SUCCESS',
        userId: deciderId,
        entrepriseId: request.entrepriseId,
        tokenId: request.tokenId,
        details: {
          requestId: request.id,
          scheduledTransactionId: request.scheduledTransactionId,
          deciderId: deciderId,
          deciderName: decider.name,
          rejectionReason,
        },
        createdAt: new Date().toISOString(),
        id: dataService.generateId('dlt'),
        completedAt: new Date().toISOString(),
      });

      // Notify employee of rejection
      const employee = await userRepo.findById(request.employeeId);
      if (employee) {
        const { emailService } = await import('../../../src/services/notifications/emailService');
        await emailService.notifyEmployeeRejected(
          employee.email,
          employee.name,
          request.requestedAmount,
          request.id,
          decider.name,
          rejectionReason || 'Rejected by decider'
        );
      }

      return res.status(200).json({
        success: true,
        action: 'rejected',
      });
    }
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to submit decision' 
    });
  }
}
