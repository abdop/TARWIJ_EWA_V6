import type { NextApiRequest, NextApiResponse } from 'next';
import { AccountBalanceQuery, AccountId } from '@hashgraph/sdk';
import { hederaClient } from '../../../src/services/hedera/client';
import { getEnterpriseTokenRepository } from '../../../src/repositories/RepositoryFactory';
import { loadPlatformStablecoin } from '../../../src/services/shop/tokenCatalog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shopAccountId } = req.query as { shopAccountId?: string };

  if (!shopAccountId) {
    return res.status(400).json({ error: 'shopAccountId is required' });
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

    // Get account balance
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(shopAccountId))
      .execute(client);

    const tokenRepo = getEnterpriseTokenRepository();
    const stablecoin = await loadPlatformStablecoin();
    const allEnterpriseTokens = await tokenRepo.findAll();

    const balances = [];

    // Check each token balance
    if (balance.tokens) {
      for (const [tokenIdStr, amount] of balance.tokens) {
        const tokenId = tokenIdStr.toString();
        const balanceAmount = amount.toNumber();

        // Find if it's an enterprise token
        const enterpriseToken = allEnterpriseTokens.find((t: any) => t.tokenId === tokenId);

        if (enterpriseToken) {
          balances.push({
            tokenId,
            symbol: enterpriseToken.symbol,
            name: enterpriseToken.name,
            decimals: enterpriseToken.decimals,
            balance: balanceAmount,
            type: 'enterprise',
            enterpriseId: enterpriseToken.entrepriseId,
            enterpriseName: enterpriseToken.name,
            swapContractId: enterpriseToken.swapContractId,
          });
        } else if (stablecoin && stablecoin.tokenId === tokenId) {
          balances.push({
            tokenId,
            symbol: stablecoin.symbol,
            name: stablecoin.name,
            decimals: stablecoin.decimals,
            balance: balanceAmount,
            type: 'platform',
            enterpriseId: null,
            enterpriseName: null,
            swapContractId: null,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      shopAccountId,
      balances,
    });
  } catch (error: any) {
    console.error('Failed to get token balances:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get token balances',
    });
  }
}
