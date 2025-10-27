/**
 * API Endpoint: Create Scheduled Mint Transaction
 * POST /api/wage-advance/create-schedule
 * 
 * Called by backend after token association is confirmed
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { wageAdvanceService } from '../../../src/services/wageAdvance/wageAdvanceService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ 
        error: 'Missing required field: requestId' 
      });
    }

    // Initialize Hedera client if not already initialized
    const { hederaClient } = await import('../../../src/services/hedera/client');
    if (!hederaClient.isInitialized()) {
      hederaClient.initializeClient(
        process.env.HEDERA_OPERATOR_ID!,
        process.env.HEDERA_OPERATOR_KEY!,
        (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet') || 'testnet'
      );
    }

    // Create scheduled mint transaction
    const scheduledTxId = await wageAdvanceService.createScheduledMint(requestId);

    return res.status(200).json({
      success: true,
      scheduledTransactionId: scheduledTxId,
    });
  } catch (error: any) {
    console.error('Error creating scheduled mint:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create scheduled mint transaction' 
    });
  }
}
