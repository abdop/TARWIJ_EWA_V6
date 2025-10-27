import type { NextApiRequest, NextApiResponse } from 'next';
import { dataService } from '../../../src/services/data/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const users = await dataService.getAllUsers();
      return res.status(200).json({ success: true, users });
    } catch (error: any) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        details: error.message,
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, role, category, entrepriseId, hedera_id } = req.body;

      // Validate required fields
      if (!name || !email || !role || !category || !entrepriseId || !hedera_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Validate Hedera ID format
      if (!/^0\.0\.\d+$/.test(hedera_id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Hedera Account ID format. Expected: 0.0.XXXXXX',
        });
      }

      // Create user with generated ID
      const userId = dataService.generateId('user');
      const newUser = await dataService.createUser({
        id: userId,
        name,
        email,
        role,
        category,
        entrepriseId,
        hedera_id,
      } as any);

      return res.status(201).json({
        success: true,
        user: newUser,
        message: 'User created successfully',
      });
    } catch (error: any) {
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
