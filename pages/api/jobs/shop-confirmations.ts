import type { NextApiRequest, NextApiResponse } from 'next';
import { pollShopTokenConfirmations } from '../../../src/jobs/shopTokenConfirmation';
import { cleanupStaleOperations } from '../../../src/jobs/cleanupStaleOperations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cleanupResult = await cleanupStaleOperations();
    const pollResult = await pollShopTokenConfirmations();

    return res.status(200).json({
      success: true,
      cleanup: cleanupResult,
      poll: pollResult,
    });
  } catch (error: any) {
    console.error('Shop confirmation job failed:', error);
    return res.status(500).json({
      error: error.message || 'Job execution failed',
    });
  }
}
