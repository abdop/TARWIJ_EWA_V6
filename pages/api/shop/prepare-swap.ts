import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  AccountId,
  ContractId,
  TransactionId,
} from '@hashgraph/sdk';
import { hederaClient } from '../../../src/services/hedera/client';
import { getUserRepository } from '../../../src/repositories/RepositoryFactory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shopAccountId, tokenId, amount, swapContractId } = req.body as {
    shopAccountId?: string;
    tokenId?: string;
    amount?: number;
    swapContractId?: string;
  };

  if (!shopAccountId || !tokenId || !amount || !swapContractId) {
    return res.status(400).json({
      error: 'shopAccountId, tokenId, amount, and swapContractId are required',
    });
  }

  try {
    // Verify shop user
    const userRepo = getUserRepository();
    const shopUser = await userRepo.findByHederaId(shopAccountId);
    if (!shopUser) {
      return res.status(404).json({ error: 'Shop user not found' });
    }

    if (shopUser.category !== 'shop_admin' && shopUser.category !== 'cashier') {
      return res.status(403).json({ error: 'Account is not authorized as a shop' });
    }

    if (!hederaClient.isInitialized()) {
      hederaClient.initializeClient(
        process.env.HEDERA_OPERATOR_ID!,
        process.env.HEDERA_OPERATOR_KEY!,
        (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet') || 'testnet'
      );
    }

    const client = hederaClient.getClient();
    if (!client) {
      return res.status(500).json({ error: 'Hedera client not initialized' });
    }

    // Create contract execute transaction for swap function
    // The swap function signature: swap(uint256 _amount)
    const functionParams = new ContractFunctionParameters()
      .addUint256(amount);

    const transaction = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(swapContractId))
      .setGas(300000) // Sufficient gas for the swap operation
      .setFunction('swap', functionParams)
      .setTransactionId(TransactionId.generate(AccountId.fromString(shopAccountId)))
      .freezeWith(client);

    const transactionBytes = Buffer.from(transaction.toBytes()).toString('base64');

    return res.status(200).json({
      success: true,
      transactionBytes,
      swapContractId,
      tokenId,
      amount,
    });
  } catch (error: any) {
    console.error('Failed to prepare swap transaction:', error);
    return res.status(500).json({
      error: error.message || 'Failed to prepare swap transaction',
    });
  }
}
