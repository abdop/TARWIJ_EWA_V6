import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getUserRepository,
  getWageAdvanceRepository,
  getEnterpriseTokenRepository,
  getDltOperationRepository,
} from '../../../src/repositories/RepositoryFactory';

const MIRROR_NODE_BASE_URL =
  process.env.HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';

async function fetchLiveTokenBalance(accountId: string, tokenId: string, fallbackDecimals = 0) {
  const headers = { Accept: 'application/json' } as const;

  const parseTokenEntry = (tokenEntry: any) => {
    if (!tokenEntry) return null;

    const balanceTiny = Number(
      tokenEntry.balance ??
        tokenEntry.balanceInTinybar ??
        tokenEntry.balance_in_tinybar ??
        tokenEntry.balance_in_tinybars ??
        tokenEntry?.balance?.balance,
    );
    const decimals = Number(
      tokenEntry.token_decimals ??
        tokenEntry.decimals ??
        tokenEntry?.token?.decimals ??
        fallbackDecimals ??
        0,
    );

    if (Number.isNaN(balanceTiny) || Number.isNaN(decimals)) {
      return null;
    }

    return balanceTiny / 10 ** decimals;
  };

  const tryAccountEndpoint = async () => {
    const url = `${MIRROR_NODE_BASE_URL}/api/v1/accounts/${accountId}`;
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`account endpoint ${response.status}`);
    }

    const data = await response.json();
    const tokens = data?.balance?.tokens ?? data?.tokens;
    if (!Array.isArray(tokens)) return null;

    const tokenEntry = tokens.find((token: any) => {
      const id =
        token?.token_id ||
        token?.tokenId ||
        token?.token?.token_id ||
        token?.token?.tokenId ||
        token?.token;
      return id === tokenId;
    });

    return parseTokenEntry(tokenEntry);
  };

  const tryTokensEndpoint = async () => {
    const url = `${MIRROR_NODE_BASE_URL}/api/v1/accounts/${accountId}/tokens?token.id=${encodeURIComponent(
      tokenId,
    )}&limit=1`;
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`account tokens endpoint ${response.status}`);
    }

    const data = await response.json();
    const tokenEntry = Array.isArray(data?.tokens) ? data.tokens[0] : null;
    return parseTokenEntry(tokenEntry);
  };

  try {
    const accountBalance = await tryAccountEndpoint();
    if (accountBalance != null) {
      return accountBalance;
    }
  } catch (err) {
    console.error('Mirror node account lookup failed:', err);
  }

  try {
    const tokenBalance = await tryTokensEndpoint();
    if (tokenBalance != null) {
      return tokenBalance;
    }
  } catch (err) {
    console.error('Mirror node account tokens lookup failed:', err);
  }

  return null;
}

const PENDING_STATUSES = new Set(['pending', 'pending_signature']);
const COMPLETED_STATUSES = new Set(['completed', 'approved']);

const sumAmounts = (requests: { requestedAmount: number }[]) =>
  requests.reduce((total, request) => total + (request.requestedAmount || 0), 0);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accountId, employeeId } = req.query;

  if (typeof accountId !== 'string' && typeof employeeId !== 'string') {
    return res.status(400).json({ success: false, error: 'accountId or employeeId is required' });
  }

  try {
    const userRepo = getUserRepository();
    const wageRepo = getWageAdvanceRepository();
    const tokenRepo = getEnterpriseTokenRepository();
    const dltRepo = getDltOperationRepository();

    const employee = typeof employeeId === 'string'
      ? await userRepo.findById(employeeId)
      : await userRepo.findByHederaId(accountId as string);

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (employee.category !== 'employee') {
      return res.status(403).json({ success: false, error: 'Only employees can access this resource' });
    }

    const [requests, token, operations, allOperations] = await Promise.all([
      wageRepo.findByEmployee(employee.id),
      employee.entrepriseId ? tokenRepo.findByEnterpriseId(employee.entrepriseId) : Promise.resolve(null),
      dltRepo.findByUser(employee.id),
      dltRepo.findAll(), // Get all operations to find shop payments by employee account
    ]);

    const pendingRequests = requests.filter((request) => PENDING_STATUSES.has(request.status));
    const completedRequests = requests.filter((request) => COMPLETED_STATUSES.has(request.status));
    const rejectedRequests = requests.filter((request) => request.status === 'rejected');

    const sortedRequests = [...requests].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

    // Calculate total shop payments (deductions from balance)
    // Shop payments have the shop as userId, so we need to search by employeeAccountId in details
    const shopPayments = allOperations.filter(
      (op) =>
        op.type === 'SHOP_ACCEPT_TOKEN_PREPARED' &&
        op.status === 'SUCCESS' &&
        op.details?.employeeAccountId === employee.hedera_id
    );
    const totalShopPayments = shopPayments.reduce(
      (sum, op) => sum + (op.details?.amount || 0),
      0
    );

    const lifetimeAdvanced = sumAmounts(completedRequests);
    const calculatedBalance = Math.max(0, lifetimeAdvanced - totalShopPayments);

    let liveBalance: number | null = null;
    if (token && employee.hedera_id) {
      liveBalance = await fetchLiveTokenBalance(employee.hedera_id, token.tokenId);
    }

    const currentBalance = liveBalance ?? calculatedBalance;

    const stats = {
      totalRequests: requests.length,
      pendingCount: pendingRequests.length,
      approvedCount: completedRequests.length,
      rejectedCount: rejectedRequests.length,
      lifetimeAdvanced,
      currentBalance,
      liveBalance,
      calculatedBalance,
      totalShopPayments,
      pendingAmount: sumAmounts(pendingRequests),
      lastRequestAt:
        sortedRequests.length > 0
          ? sortedRequests[0].updatedAt || sortedRequests[0].createdAt
          : null,
    };

    const mappedRequests = sortedRequests.map((request) => ({
      id: request.id,
      requestedAmount: request.requestedAmount,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      completedAt: request.completedAt ?? null,
      rejectionReason: request.rejectionReason ?? null,
    }));

    const recentActivity = [...operations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((operation) => ({
        id: operation.id,
        type: operation.type,
        status: operation.status,
        createdAt: operation.createdAt,
        details: operation.details,
        transactionId: operation.transactionId ?? null,
      }));

    const overview = {
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        entrepriseId: employee.entrepriseId,
        accountId: employee.hedera_id,
      },
      stats,
      token: token
        ? {
            tokenId: token.tokenId,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            treasuryAccountId: token.treasuryAccountId,
          }
        : null,
      requests: mappedRequests,
      pendingRequests: pendingRequests.map((request) => ({
        id: request.id,
        requestedAmount: request.requestedAmount,
        status: request.status,
        createdAt: request.createdAt,
      })),
      recentActivity,
    };

    return res.status(200).json({ success: true, data: overview });
  } catch (error: any) {
    console.error('Employee overview error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to load overview' });
  }
}
