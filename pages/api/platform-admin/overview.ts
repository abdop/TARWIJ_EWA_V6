import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getEnterpriseRepository,
  getEnterpriseTokenRepository,
  getUserRepository,
  getWageAdvanceRepository,
  getDltOperationRepository,
} from '../../../src/repositories/RepositoryFactory';

const DAYS_OF_TREND = 30;

const isWithinDays = (dateString: string | undefined, days: number) => {
  if (!dateString) {
    return false;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= 0;
};

const toDateKey = (dateString: string | undefined) => {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

const sumAmounts = (values: Array<{ requestedAmount: number | string | null | undefined }>) =>
  values.reduce((total, item) => {
    const rawAmount =
      typeof item.requestedAmount === 'string'
        ? Number(item.requestedAmount)
        : item.requestedAmount ?? 0;
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
    return total + amount;
  }, 0);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const enterpriseRepo = getEnterpriseRepository();
    const tokenRepo = getEnterpriseTokenRepository();
    const userRepo = getUserRepository();
    const wageRepo = getWageAdvanceRepository();
    const dltRepo = getDltOperationRepository();

    const [enterprises, tokens, users, wageRequests, dltOperations] = await Promise.all([
      enterpriseRepo.findAll(),
      tokenRepo.findAll(),
      userRepo.findAll(),
      wageRepo.findAll(),
      dltRepo.findAll(),
    ]);

    const enterpriseMap = new Map(enterprises.map((ent) => [ent.id, ent]));
    const tokenMap = new Map(tokens.map((token) => [token.entrepriseId, token]));

    const usersByEnterprise = new Map<string, typeof users>();
    users.forEach((user) => {
      if (!user.entrepriseId) return;
      const collection = usersByEnterprise.get(user.entrepriseId) ?? [];
      collection.push(user);
      usersByEnterprise.set(user.entrepriseId, collection);
    });

    const wageByEnterprise = new Map<string, typeof wageRequests>();
    wageRequests.forEach((request) => {
      if (!request.entrepriseId) return;
      const collection = wageByEnterprise.get(request.entrepriseId) ?? [];
      collection.push(request);
      wageByEnterprise.set(request.entrepriseId, collection);
    });

    const stats = {
      totalEnterprises: enterprises.length,
      totalPlatformUsers: users.length,
      totalAdmins: users.filter((user) => user.category === 'ent_admin').length,
      totalDeciders: users.filter((user) => user.category === 'decider').length,
      totalEmployees: users.filter((user) => user.category === 'employee').length,
      totalWageRequests: wageRequests.length,
      pendingWageRequests: wageRequests.filter((request) => ['pending', 'pending_signature'].includes(request.status)).length,
      completedWageRequests: wageRequests.filter((request) => ['completed', 'approved'].includes(request.status)).length,
      rejectedWageRequests: wageRequests.filter((request) => request.status === 'rejected').length,
      totalAdvancedAmount: sumAmounts(wageRequests.filter((request) => ['completed', 'approved'].includes(request.status))),
      pendingAmount: sumAmounts(wageRequests.filter((request) => ['pending', 'pending_signature'].includes(request.status))),
    };

    const enterpriseSummaries = enterprises.map((enterprise) => {
      const enterpriseUsers = usersByEnterprise.get(enterprise.id) ?? [];
      const enterpriseWageRequests = wageByEnterprise.get(enterprise.id) ?? [];
      const enterpriseToken = tokenMap.get(enterprise.id);

      const adminCount = enterpriseUsers.filter((user) => user.category === 'ent_admin').length;
      const deciderCount = enterpriseUsers.filter((user) => user.category === 'decider').length;
      const employeeCount = enterpriseUsers.filter((user) => user.category === 'employee').length;

      const pending = enterpriseWageRequests.filter((request) => ['pending', 'pending_signature'].includes(request.status));
      const completed = enterpriseWageRequests.filter((request) => ['completed', 'approved'].includes(request.status));
      const rejected = enterpriseWageRequests.filter((request) => request.status === 'rejected');

      return {
        id: enterprise.id,
        name: enterprise.name,
        symbol: enterprise.symbol,
        industry: enterprise.industry,
        userCounts: {
          total: enterpriseUsers.length,
          admin: adminCount,
          decider: deciderCount,
          employee: employeeCount,
        },
        wageRequests: {
          total: enterpriseWageRequests.length,
          pending: pending.length,
          completed: completed.length,
          rejected: rejected.length,
          totalAdvanced: sumAmounts(completed),
          pendingAmount: sumAmounts(pending),
        },
        token: enterpriseToken
          ? {
              tokenId: enterpriseToken.tokenId,
              symbol: enterpriseToken.symbol,
              settlementDay: enterpriseToken.settlementDay ?? null,
            }
          : null,
      };
    });

    const topEnterprisesByEmployees = [...enterpriseSummaries]
      .sort((a, b) => b.userCounts.employee - a.userCounts.employee)
      .slice(0, 5);

    const topEnterprisesByAdvanceVolume = [...enterpriseSummaries]
      .sort((a, b) => b.wageRequests.totalAdvanced - a.wageRequests.totalAdvanced)
      .slice(0, 5);

    const now = new Date();
    const trendSeed = Array.from({ length: DAYS_OF_TREND }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (DAYS_OF_TREND - 1 - index));
      const dateKey = date.toISOString().slice(0, 10);
      return { dateKey, total: 0, completed: 0, pending: 0, rejected: 0 };
    });
    const trendMap = new Map(trendSeed.map((entry) => [entry.dateKey, entry]));

    wageRequests.forEach((request) => {
      const trendKey = toDateKey(request.createdAt);
      if (!trendKey || !trendMap.has(trendKey) || !isWithinDays(request.createdAt, DAYS_OF_TREND)) {
        return;
      }
      const entry = trendMap.get(trendKey)!;
      entry.total += 1;
      if (['completed', 'approved'].includes(request.status)) {
        entry.completed += 1;
      } else if (['pending', 'pending_signature'].includes(request.status)) {
        entry.pending += 1;
      } else if (request.status === 'rejected') {
        entry.rejected += 1;
      }
    });

    const wageRequestTrend = Array.from(trendMap.values());

    const recentActivity = [...dltOperations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15)
      .map((operation) => ({
        id: operation.id,
        type: operation.type,
        status: operation.status,
        createdAt: operation.createdAt,
        entrepriseId: operation.entrepriseId ?? null,
        enterpriseName: operation.entrepriseId ? enterpriseMap.get(operation.entrepriseId)?.name ?? null : null,
        tokenId: operation.tokenId ?? null,
        details: operation.details ?? null,
        transactionId: operation.transactionId ?? null,
      }));

    return res.status(200).json({
      success: true,
      data: {
        stats,
        enterprises: enterpriseSummaries,
        topEnterprisesByEmployees,
        topEnterprisesByAdvanceVolume,
        wageRequestTrend,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Platform admin overview error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to load platform overview' });
  }
}
