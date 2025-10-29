import type { NextApiRequest, NextApiResponse } from 'next';
import { getEcosystemTokens } from '../../../src/services/shop/tokenCatalog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shopAccountId } = req.query;
    const shopAccountIdString = typeof shopAccountId === 'string' ? shopAccountId : undefined;

    const tokens = await getEcosystemTokens(shopAccountIdString);

    return res.status(200).json({
      success: true,
      tokens,
    });
  } catch (error: any) {
    console.error('Failed to fetch ecosystem tokens:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch ecosystem tokens',
    });
  }
}
