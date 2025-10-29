import type { NextApiRequest, NextApiResponse } from 'next';
import {
  AccountId,
  AccountInfoQuery,
  TokenAssociateTransaction,
  TokenId,
  TransactionId,
} from '@hashgraph/sdk';

import { hederaClient } from '../../../src/services/hedera/client';
import {
  getDltOperationRepository,
  getEnterpriseTokenRepository,
  getUserRepository,
} from '../../../src/repositories/RepositoryFactory';
import { dataService } from '../../../src/services/data/dataService';
import { loadPlatformStablecoin } from '../../../src/services/shop/tokenCatalog';

async function isTokenAlreadyAssociated(
  shopAccountId: string,
  tokenId: string
): Promise<boolean> {
  if (!hederaClient.isInitialized()) {
    hederaClient.initializeClient(
      process.env.HEDERA_OPERATOR_ID!,
      process.env.HEDERA_OPERATOR_KEY!,
      (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet') || 'testnet'
    );
  }

  const client = hederaClient.getClient();
  if (!client) {
    return false;
  }

  try {
    const info = await new AccountInfoQuery()
      .setAccountId(AccountId.fromString(shopAccountId))
      .execute(client);

    const relationships: any = info.tokenRelationships;
    if (!relationships) {
      return false;
    }

    if (typeof relationships.values === 'function') {
      for (const relationship of relationships.values()) {
        if (relationship?.tokenId?.toString() === tokenId) {
          return true;
        }
      }
    } else if (typeof relationships.entries === 'function') {
      for (const [, relationship] of relationships.entries()) {
        if (relationship?.tokenId?.toString() === tokenId) {
          return true;
        }
      }
    } else if (Array.isArray(relationships)) {
      return relationships.some(
        (relationship) => relationship?.tokenId?.toString() === tokenId
      );
    } else if (relationships?._map && typeof relationships._map.values === 'function') {
      for (const relationship of relationships._map.values()) {
        if (relationship?.tokenId?.toString() === tokenId) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to verify token association:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shopAccountId, tokenId } = req.body as {
    shopAccountId?: string;
    tokenId?: string;
  };

  if (!shopAccountId || !tokenId) {
    return res.status(400).json({ error: 'shopAccountId and tokenId are required' });
  }

  try {
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

    const userRepo = getUserRepository();
    const shopUser = await userRepo.findByHederaId(shopAccountId);
    if (!shopUser) {
      return res.status(404).json({ error: 'Shop user not found' });
    }

    if (shopUser.category !== 'shop_admin' && shopUser.category !== 'cashier') {
      return res.status(403).json({ error: 'Account is not authorized as a shop' });
    }

    const tokenRepo = getEnterpriseTokenRepository();
    const enterpriseToken = await tokenRepo.findByTokenId(tokenId);
    const stablecoin = await loadPlatformStablecoin();

    if (!enterpriseToken && (!stablecoin || stablecoin.tokenId !== tokenId)) {
      return res.status(404).json({ error: 'Token not found in ecosystem catalog' });
    }

    const alreadyAssociated = await isTokenAlreadyAssociated(shopAccountId, tokenId);
    if (alreadyAssociated) {
      return res.status(400).json({ error: 'Shop account already associated with this token' });
    }

    const transaction = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(shopAccountId))
      .setTokenIds([TokenId.fromString(tokenId)])
      .setTransactionId(TransactionId.generate(AccountId.fromString(shopAccountId)))
      .freezeWith(client);

    const transactionBytes = Buffer.from(transaction.toBytes()).toString('base64');

    const dltOpRepo = getDltOperationRepository();
    const operation = await dltOpRepo.create({
      type: 'SHOP_TOKEN_ASSOCIATE_PREPARED',
      status: 'PENDING_SIGNATURE',
      userId: shopUser.id,
      entrepriseId: shopUser.entrepriseId,
      tokenId,
      details: {
        shopAccountId,
        tokenId,
        enterpriseId: enterpriseToken?.entrepriseId ?? null,
        tokenType: enterpriseToken ? 'enterprise' : 'platform',
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId('dlt'),
    });

    return res.status(200).json({
      success: true,
      transactionBytes,
      tokenId,
      operationId: operation.id,
    });
  } catch (error: any) {
    console.error('Failed to prepare token association:', error);
    return res.status(500).json({
      error: error.message || 'Failed to prepare token association',
    });
  }
}
