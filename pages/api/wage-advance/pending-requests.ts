/**
 * API Endpoint: Get Pending Wage Advance Requests
 * GET /api/wage-advance/pending-requests?deciderId=xxx
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getWageAdvanceRepository, getUserRepository } from '../../../src/repositories/RepositoryFactory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deciderId } = req.query;

    if (!deciderId || typeof deciderId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required parameter: deciderId' 
      });
    }

    const userRepo = getUserRepository();
    const wageAdvanceRepo = getWageAdvanceRepository();

    // Get decider info
    const decider = await userRepo.findById(deciderId);
    if (!decider || decider.category !== 'decider') {
      return res.status(403).json({ error: 'Invalid decider' });
    }
    
    if (!decider.entrepriseId) {
      return res.status(400).json({ error: 'Decider has no enterprise association' });
    }

    // Get all pending requests for the enterprise
    const allRequests = await wageAdvanceRepo.findByEnterprise(decider.entrepriseId);
    
    // Filter for pending_signature status and requests where this decider hasn't voted
    const pendingRequests = allRequests.filter(request => {
      if (request.status !== 'pending_signature') return false;
      
      const hasVoted = request.deciderApprovals?.some(
        approval => approval.deciderId === deciderId
      );
      
      return !hasVoted;
    });

    // Enrich with employee info
    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const employee = await userRepo.findById(request.employeeId);
        return {
          ...request,
          employeeName: employee?.name || 'Unknown',
          employeeEmail: employee?.email || '',
        };
      })
    );

    return res.status(200).json({
      success: true,
      requests: enrichedRequests,
    });
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch pending requests' 
    });
  }
}
