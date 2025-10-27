/**
 * API Endpoint: Prepare Decision Transaction
 * POST /api/wage-advance/prepare-decision
 * 
 * Returns transaction bytes for decider to sign with their wallet
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ScheduleSignTransaction, ScheduleDeleteTransaction, TransactionId, AccountId, PrivateKey } from '@hashgraph/sdk';
import { hederaClient } from '../../../src/services/hedera/client';
import { getWageAdvanceRepository, getUserRepository } from '../../../src/repositories/RepositoryFactory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId, deciderId, approved } = req.body;

    if (!requestId || !deciderId || approved === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: requestId, deciderId, approved' 
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

    const wageAdvanceRepo = getWageAdvanceRepository();
    const userRepo = getUserRepository();
    
    const request = await wageAdvanceRepo.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!request.scheduledTransactionId) {
      return res.status(400).json({ error: 'No scheduled transaction found' });
    }

    const decider = await userRepo.findById(deciderId);
    if (!decider) {
      return res.status(404).json({ error: 'Decider not found' });
    }

    const client = hederaClient.getClient();
    if (!client) {
      return res.status(500).json({ error: 'Failed to initialize Hedera client' });
    }

    const deciderAccount = AccountId.fromString(decider.hedera_id);

    if (approved) {
      // Prepare ScheduleSignTransaction for approval
      // IMPORTANT: Set decider as transaction payer so they can sign it
      const scheduleSignTx = new ScheduleSignTransaction()
        .setScheduleId(request.scheduledTransactionId)
        .setTransactionId(TransactionId.generate(deciderAccount)) // Decider is the payer
        .freezeWith(client);

      const transactionBytes = Buffer.from(scheduleSignTx.toBytes()).toString('base64');

      return res.status(200).json({
        success: true,
        transactionBytes,
        action: 'approve',
        scheduleId: request.scheduledTransactionId,
      });
    } else {
      // For rejection: ScheduleDelete is not supported by most wallets
      // Instead, we'll have the backend execute the deletion with the delete key
      // The decider just needs to confirm the rejection (no wallet signing needed)
      
      if (!request.deleteKey) {
        return res.status(400).json({ 
          error: 'Delete key not found for scheduled transaction' 
        });
      }

      // Return confirmation request (no transaction bytes needed)
      return res.status(200).json({
        success: true,
        action: 'reject',
        scheduleId: request.scheduledTransactionId,
        requiresWalletSignature: false,
        message: 'Rejection will be executed by the system',
      });
    }
  } catch (error: any) {
    console.error('Error preparing decision transaction:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to prepare decision transaction' 
    });
  }
}
