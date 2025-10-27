/**
 * API Endpoint: Check Token Association Status
 * POST /api/wage-advance/associate-token
 * 
 * This endpoint checks if the employee needs to associate the token
 * and returns the transaction bytes for the employee to sign with their wallet
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { AccountId, TokenId, TokenAssociateTransaction, TransactionId, AccountInfoQuery } from '@hashgraph/sdk';
import { hederaClient } from '../../../src/services/hedera/client';
import { getUserRepository, getWageAdvanceRepository } from '../../../src/repositories/RepositoryFactory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId, employeeAccountId } = req.body;

    if (!requestId || !employeeAccountId) {
      return res.status(400).json({ 
        error: 'Missing required fields: requestId, employeeAccountId' 
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
    const request = await wageAdvanceRepo.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const client = hederaClient.getClient();
    if (!client) {
      return res.status(500).json({ error: 'Failed to initialize Hedera client' });
    }
    const employeeAccount = AccountId.fromString(employeeAccountId);
    const tokenId = TokenId.fromString(request.tokenId);

    // Check if token is already associated with the employee account
    try {
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(employeeAccount)
        .execute(client);

      // Check if token is in the account's token relationships
      const tokenRelationships = accountInfo.tokenRelationships;
      const tokenRelationship = tokenRelationships.get(tokenId);

      if (tokenRelationship) {
        console.log(`Token ${request.tokenId} already associated with account ${employeeAccountId}`);
        return res.status(200).json({
          success: true,
          needsAssociation: false,
          message: 'Token already associated with your account',
        });
      }

      console.log(`Token ${request.tokenId} not associated with account ${employeeAccountId} - creating association transaction`);
    } catch (error: any) {
      console.error('Error checking token association:', error);
      // If we can't check, proceed with association attempt
      // The transaction will fail if already associated
    }

    // Create token association transaction
    // IMPORTANT: Set the employee as the transaction payer so they can sign it
    const associateTx = new TokenAssociateTransaction()
      .setAccountId(employeeAccount)
      .setTokenIds([tokenId])
      .setTransactionId(TransactionId.generate(employeeAccount)) // Employee is the payer
      .freezeWith(client);

    // Convert to bytes for HashConnect signing
    const transactionBytes = Buffer.from(associateTx.toBytes()).toString('base64');

    return res.status(200).json({
      success: true,
      needsAssociation: true,
      transactionBytes,
      tokenId: request.tokenId,
    });
  } catch (error: any) {
    console.error('Error preparing token association:', error);
    
    // If token is already associated, that's fine
    if (error.message && error.message.includes('TOKEN_ALREADY_ASSOCIATED')) {
      return res.status(200).json({
        success: true,
        needsAssociation: false,
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Failed to prepare token association' 
    });
  }
}
