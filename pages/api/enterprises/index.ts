import type { NextApiRequest, NextApiResponse } from 'next';
import { dataService } from '../../../src/services/data/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const enterprises = await dataService.getAllEnterprises();
      return res.status(200).json({ success: true, enterprises });
    } catch (error: any) {
      console.error('Get enterprises error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch enterprises',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
