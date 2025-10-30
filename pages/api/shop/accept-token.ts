import type { NextApiRequest, NextApiResponse } from 'next';
import { AccountId, TokenId, TransactionId, TransferTransaction } from '@hashgraph/sdk';
import { hederaClient } from '../../../src/services/hedera/client';
import {
  getUserRepository,
  getEnterpriseTokenRepository,
  getDltOperationRepository,
} from '../../../src/repositories/RepositoryFactory';
import { dataService } from '../../../src/services/data/dataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userRepo = getUserRepository();
  const dltOpRepo = getDltOperationRepository();

  if (req.method === 'GET') {
    const { shopAccountId } = req.query;

    if (typeof shopAccountId !== 'string' || !shopAccountId) {
      return res.status(400).json({ error: 'shopAccountId query param is required' });
    }

    try {
      const shopUser = await userRepo.findByHederaId(shopAccountId);
      if (!shopUser) {
        return res.status(404).json({ error: 'Shop user not found' });
      }

      if (shopUser.category !== 'shop_admin' && shopUser.category !== 'cashier') {
        return res.status(403).json({ error: 'Account is not authorized as a shop' });
      }

      const operations = await dltOpRepo.findByUser(shopUser.id);
      const filtered = operations
        .filter((op) => {
          if (!op.type) return false;
          return (
            op.type.startsWith('SHOP_ACCEPT_TOKEN') ||
            op.type.startsWith('SHOP_TOKEN_ASSOCIATE')
          );
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((op) => ({
          id: op.id,
          type: op.type ?? 'UNKNOWN',
          status: op.status,
          createdAt: op.createdAt,
          completedAt: op.completedAt ?? null,
          tokenId: op.tokenId ?? null,
          transactionId: op.transactionId ?? op.details?.transactionId ?? null,
          details: {
            employeeAccountId: op.details?.employeeAccountId ?? null,
            shopAccountId: op.details?.shopAccountId ?? null,
            amount: typeof op.details?.amount === 'number' ? op.details.amount : null,
            memo: op.details?.memo ?? null,
            decimals: typeof op.details?.decimals === 'number' ? op.details.decimals : null,
            message: op.details?.message ?? null,
          },
        }));

      return res.status(200).json({ success: true, operations: filtered });
    } catch (error: any) {
      console.error('Error fetching shop token operations:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch operations' });
    }
  }

  if (req.method === 'PATCH') {
    const { operationId, transactionId, shopAccountId, status, message } = req.body as {
      operationId?: string;
      transactionId?: string;
      shopAccountId?: string;
      status?: string;
      message?: string;
    };

    if (!operationId || !transactionId || !shopAccountId) {
      return res.status(400).json({
        error: 'operationId, transactionId and shopAccountId are required',
      });
    }

    try {
      const shopUser = await userRepo.findByHederaId(shopAccountId);
      if (!shopUser) {
        return res.status(404).json({ error: 'Shop user not found' });
      }

      const operation = await dltOpRepo.findById(operationId);
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }

      const allowedTypes = ['SHOP_ACCEPT_TOKEN_PREPARED', 'SHOP_TOKEN_ASSOCIATE_PREPARED'];
      if (!allowedTypes.includes(operation.type)) {
        return res.status(400).json({ error: 'Operation type mismatch' });
      }

      if (operation.userId !== shopUser.id) {
        return res.status(403).json({ error: 'Operation does not belong to this shop account' });
      }

      if (
        operation.details?.shopAccountId &&
        operation.details.shopAccountId !== shopAccountId
      ) {
        return res.status(403).json({ error: 'Operation shop account mismatch' });
      }

      const statusToSet = status ?? 'PENDING_CONFIRMATION';
      const updatedDetails = {
        ...(operation.details ?? {}),
        transactionId,
        message:
          message ??
          (operation.type === 'SHOP_TOKEN_ASSOCIATE_PREPARED'
            ? 'Association submitted to Hedera network'
            : 'Transaction submitted to Hedera network'),
      };

      const updatePayload: {
        status: string;
        transactionId: string;
        details: typeof updatedDetails;
        completedAt?: string;
      } = {
        status: statusToSet,
        transactionId,
        details: updatedDetails,
      };

      if (statusToSet === 'SUCCESS' || statusToSet === 'ERROR') {
        updatePayload.completedAt = new Date().toISOString();
      }

      const updatedOperation = await dltOpRepo.update(operationId, updatePayload);

      return res.status(200).json({ success: true, operation: updatedOperation });
    } catch (error: any) {
      console.error('Error updating shop token operation:', error);
      return res.status(500).json({
        error: error.message || 'Failed to update operation',
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeAccountId, shopAccountId, amount, memo } = req.body as {
    employeeAccountId?: string;
    shopAccountId?: string;
    amount?: number;
    memo?: string;
  };

  if (!employeeAccountId || !shopAccountId || !amount || amount <= 0) {
    return res.status(400).json({
      error: 'Missing required fields: employeeAccountId, shopAccountId, amount (>0)',
    });
  }

  try {
    if (!hederaClient.isInitialized()) {
      hederaClient.initializeClient(
        process.env.HEDERA_OPERATOR_ID!,
        process.env.HEDERA_OPERATOR_KEY!,
        (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet') || 'testnet'
      );
    }

    const tokenRepo = getEnterpriseTokenRepository();

    const shopUser = await userRepo.findByHederaId(shopAccountId);
    const employeeUser = await userRepo.findByHederaId(employeeAccountId);

    if (!shopUser) {
      return res.status(404).json({ error: 'Shop user not found' });
    }
    if (shopUser.category !== 'shop_admin' && shopUser.category !== 'cashier') {
      return res.status(403).json({ error: 'Account is not authorized as a shop' });
    }
    if (!employeeUser) {
      return res.status(404).json({ error: 'Employee user not found' });
    }

    if (!employeeUser.entrepriseId) {
      return res.status(400).json({ error: 'Employee does not belong to any enterprise' });
    }

    const enterpriseToken = await tokenRepo.findByEnterpriseId(employeeUser.entrepriseId);
    if (!enterpriseToken) {
      return res.status(400).json({ error: 'Enterprise token not configured for employee enterprise' });
    }

    const tokenId = TokenId.fromString(enterpriseToken.tokenId);
    const client = hederaClient.getClient();
    if (!client) {
      return res.status(500).json({ error: 'Hedera client not initialized' });
    }

    const generatedTransactionId = TransactionId.generate(AccountId.fromString(employeeAccountId));

    const transaction = await new TransferTransaction()
      .addTokenTransfer(tokenId, AccountId.fromString(employeeAccountId), -amount)
      .addTokenTransfer(tokenId, AccountId.fromString(shopAccountId), amount)
      .setTransactionId(generatedTransactionId)
      .setTransactionMemo(memo?.slice(0, 100) || 'Shop purchase settlement')
      .setTransactionValidDuration(180) // 3 minutes validity
      .freezeWith(client);

    const transactionBytes = Buffer.from(transaction.toBytes()).toString('base64');
    const transactionIdString = generatedTransactionId.toString();

    const operation = await dltOpRepo.create({
      type: 'SHOP_ACCEPT_TOKEN_PREPARED',
      status: 'PENDING_SIGNATURE',
      userId: shopUser.id,
      entrepriseId: employeeUser.entrepriseId,
      tokenId: enterpriseToken.tokenId,
      details: {
        employeeAccountId,
        shopAccountId,
        amount,
        memo,
        decimals: enterpriseToken.decimals ?? 2,
        employeeEnterpriseId: employeeUser.entrepriseId,
        transactionId: transactionIdString,
      },
      transactionId: transactionIdString,
      createdAt: new Date().toISOString(),
      id: dataService.generateId('dlt'),
    });

    return res.status(200).json({
      success: true,
      transactionBytes,
      tokenId: enterpriseToken.tokenId,
      decimals: enterpriseToken.decimals,
      operationId: operation.id,
      transactionId: transactionIdString,
      tokenSymbol: enterpriseToken.symbol,
    });
  } catch (error: any) {
    console.error('Error preparing shop token acceptance:', error);
    return res.status(500).json({
      error: error.message || 'Failed to prepare token acceptance transaction',
    });
  }
}
