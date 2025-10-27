/**
 * API Endpoint: Request Wage Advance
 * POST /api/wage-advance/request
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { wageAdvanceService } from '../../../src/services/wageAdvance/wageAdvanceService';
import { getWageAdvanceRepository } from '../../../src/repositories/RepositoryFactory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId, requestedAmount } = req.body;

    if (!employeeId || !requestedAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: employeeId, requestedAmount' 
      });
    }

    // Check for existing pending requests BEFORE creating new one
    const wageAdvanceRepo = getWageAdvanceRepository();
    const allRequests = await wageAdvanceRepo.findByEmployee(employeeId);
    const pendingRequests = allRequests.filter(
      (req) => req.status === 'pending' || req.status === 'pending_signature'
    );

    if (pendingRequests.length > 0) {
      return res.status(400).json({ 
        error: 'You already have a pending wage advance request. Only one request can be pending at a time.',
        existingRequest: pendingRequests[0]
      });
    }

    // Create wage advance request
    const request = await wageAdvanceService.requestWageAdvance({
      employeeId,
      requestedAmount: parseInt(requestedAmount),
    });

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error: any) {
    console.error('Error creating wage advance request:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create wage advance request' 
    });
  }
}
