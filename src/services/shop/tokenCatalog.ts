import { promises as fs } from 'fs';
import path from 'path';
import { AccountId, AccountInfoQuery } from '@hashgraph/sdk';

import { getEnterpriseTokenRepository } from '../../repositories/RepositoryFactory';
import { hederaClient } from '../hedera/client';

export interface EcosystemToken {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  type: 'enterprise' | 'platform';
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  isAssociated?: boolean;
}

const PLATFORM_STABLECOIN_FILE = path.join(
  process.cwd(),
  'platform-stablecoin-info.json'
);

export const loadPlatformStablecoin = async (): Promise<EcosystemToken | null> => {
  try {
    const fileContents = await fs.readFile(PLATFORM_STABLECOIN_FILE, 'utf-8');
    const parsed = JSON.parse(fileContents);

    if (!parsed?.token?.id) {
      return null;
    }

    return {
      tokenId: parsed.token.id,
      symbol: parsed.token.symbol,
      name: parsed.token.name,
      decimals: parsed.token.decimals ?? 2,
      type: 'platform',
      enterpriseId: null,
      enterpriseName: 'Platform Stablecoin',
    };
  } catch (error) {
    console.warn('Platform stablecoin metadata unavailable:', error);
    return null;
  }
};

const getAssociatedTokenIds = async (
  shopAccountId?: string
): Promise<Set<string> | null> => {
  if (!shopAccountId) {
    return null;
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
    return null;
  }

  try {
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(AccountId.fromString(shopAccountId))
      .execute(client);

    const relationships: any = accountInfo.tokenRelationships;
    if (!relationships) {
      return new Set<string>();
    }

    const associated = new Set<string>();

    if (typeof relationships.values === 'function') {
      for (const relationship of relationships.values()) {
        const tokenId = relationship?.tokenId?.toString();
        if (tokenId) {
          associated.add(tokenId);
        }
      }
    } else if (typeof relationships.entries === 'function') {
      for (const [, relationship] of relationships.entries()) {
        const tokenId = relationship?.tokenId?.toString();
        if (tokenId) {
          associated.add(tokenId);
        }
      }
    } else if (Array.isArray(relationships)) {
      relationships.forEach((relationship) => {
        const tokenId = relationship?.tokenId?.toString();
        if (tokenId) {
          associated.add(tokenId);
        }
      });
    } else if (relationships?._map && typeof relationships._map.values === 'function') {
      for (const relationship of relationships._map.values()) {
        const tokenId = relationship?.tokenId?.toString();
        if (tokenId) {
          associated.add(tokenId);
        }
      }
    }

    return associated;
  } catch (error) {
    console.error('Failed to load token associations for shop account:', error);
    return null;
  }
};

export const getEcosystemTokens = async (
  shopAccountId?: string
): Promise<EcosystemToken[]> => {
  const tokenRepo = getEnterpriseTokenRepository();
  const enterpriseTokens = await tokenRepo.findAll();

  const tokens: EcosystemToken[] = enterpriseTokens
    .filter((token) => Boolean(token?.tokenId))
    .map((token) => ({
      tokenId: token.tokenId,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals ?? 2,
      type: 'enterprise',
      enterpriseId: token.entrepriseId,
      enterpriseName: token.name,
    }));

  const platformStablecoin = await loadPlatformStablecoin();
  if (platformStablecoin) {
    tokens.unshift(platformStablecoin);
  }

  const associatedTokenIds = await getAssociatedTokenIds(shopAccountId);
  if (!associatedTokenIds) {
    return tokens;
  }

  return tokens.map((token) => ({
    ...token,
    isAssociated: associatedTokenIds.has(token.tokenId),
  }));
};
