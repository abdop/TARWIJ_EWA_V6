import type { NextApiRequest, NextApiResponse } from 'next';
import { dataService } from '../../../src/services/data/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  if (req.method === 'GET') {
    try {
      const user = await dataService.getUser(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      console.error('Get user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        details: error.message,
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, email, role, category, entrepriseId } = req.body;

      // Validate that hedera_id is not being modified
      if (req.body.hedera_id !== undefined) {
        return res.status(400).json({
          success: false,
          error: 'Hedera Account ID cannot be modified',
        });
      }

      // Build updates object (only include provided fields)
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (role !== undefined) updates.role = role;
      if (category !== undefined) updates.category = category;
      if (entrepriseId !== undefined) updates.entrepriseId = entrepriseId;

      const updatedUser = await dataService.updateUser(id, updates);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        user: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user',
        details: error.message,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await dataService.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
