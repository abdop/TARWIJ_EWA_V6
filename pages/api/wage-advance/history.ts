/**
 * API Endpoint: Get Wage Advance History
 * GET /api/wage-advance/history?entrepriseId=xxx
 * 
 * Returns completed/rejected wage advance requests for an enterprise
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
    const { entrepriseId } = req.query;

    console.log('History API called with entrepriseId:', entrepriseId);

    if (!entrepriseId || typeof entrepriseId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required parameter: entrepriseId' 
      });
    }

    const wageAdvanceRepo = getWageAdvanceRepository();
    const userRepo = getUserRepository();

    // Get all requests for the enterprise
    const allRequests = await wageAdvanceRepo.findByEnterprise(entrepriseId);
    console.log('All requests for enterprise:', allRequests.length);

    // Filter for completed or rejected requests
    const historyRequests = allRequests.filter(
      (req) => req.status === 'approved' || req.status === 'rejected' || req.status === 'completed'
    );
    console.log('History requests (filtered):', historyRequests.length);

    // Sort by completion date (most recent first)
    historyRequests.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.updatedAt).getTime();
      const dateB = new Date(b.completedAt || b.updatedAt).getTime();
      return dateB - dateA;
    });

    // Enrich with employee information
    const enrichedRequests = await Promise.all(
      historyRequests.map(async (request) => {
        const employee = await userRepo.findById(request.employeeId);
        
        // Get decider who rejected (if rejected)
        let rejectedByDecider = null;
        if (request.rejectedBy) {
          rejectedByDecider = await userRepo.findById(request.rejectedBy);
        }

        return {
          id: request.id,
          employeeId: request.employeeId,
          employeeName: employee?.name || 'Unknown',
          employeeEmail: employee?.email || '',
          requestedAmount: request.requestedAmount,
          status: request.status,
          scheduledTransactionId: request.scheduledTransactionId,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          completedAt: request.completedAt,
          deciderApprovals: request.deciderApprovals || [],
          rejectionReason: request.rejectionReason,
          rejectedBy: request.rejectedBy,
          rejectedByName: rejectedByDecider?.name,
        };
      })
    );

    console.log('Returning enriched requests:', enrichedRequests.length);

    return res.status(200).json({
      success: true,
      requests: enrichedRequests,
      total: enrichedRequests.length,
    });
  } catch (error: any) {
    console.error('Error fetching wage advance history:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch history' 
    });
  }
}
