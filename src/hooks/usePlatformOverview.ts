import { useCallback, useEffect, useRef, useState } from 'react';

export interface PlatformOverviewStats {
  totalEnterprises: number;
  totalPlatformUsers: number;
  totalAdmins: number;
  totalDeciders: number;
  totalEmployees: number;
  totalWageRequests: number;
  pendingWageRequests: number;
  completedWageRequests: number;
  rejectedWageRequests: number;
  totalAdvancedAmount: number;
  pendingAmount: number;
}

export interface PlatformEnterpriseSummary {
  id: string;
  name: string;
  symbol: string;
  industry: string;
  userCounts: {
    total: number;
    admin: number;
    decider: number;
    employee: number;
  };
  wageRequests: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    totalAdvanced: number;
    pendingAmount: number;
  };
  token: {
    tokenId: string;
    symbol: string;
    settlementDay: number | null;
  } | null;
}

export interface PlatformWageTrendPoint {
  dateKey: string;
  total: number;
  completed: number;
  pending: number;
  rejected: number;
}

export interface PlatformRecentActivityItem {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  entrepriseId: string | null;
  enterpriseName: string | null;
  tokenId: string | null;
  details: Record<string, unknown> | null;
  transactionId: string | null;
}

export interface PlatformOverviewResponse {
  success: boolean;
  data: {
    stats: PlatformOverviewStats;
    enterprises: PlatformEnterpriseSummary[];
    topEnterprisesByEmployees: PlatformEnterpriseSummary[];
    topEnterprisesByAdvanceVolume: PlatformEnterpriseSummary[];
    wageRequestTrend: PlatformWageTrendPoint[];
    recentActivity: PlatformRecentActivityItem[];
  };
}

interface UsePlatformOverviewOptions {
  enabled?: boolean;
  refreshIntervalMs?: number;
}

export function usePlatformOverview({
  enabled = true,
  refreshIntervalMs,
}: UsePlatformOverviewOptions = {}) {
  const [data, setData] = useState<PlatformOverviewResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/platform-admin/overview', {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load platform overview (status ${response.status})`);
      }

      const payload = (await response.json()) as PlatformOverviewResponse;
      if (!payload.success) {
        throw new Error('Platform overview request failed');
      }

      setData(payload.data);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('usePlatformOverview error:', err);
      setError((err as Error).message || 'Failed to load platform overview');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();

    if (!refreshIntervalMs || refreshIntervalMs <= 0) {
      return () => {
        abortController.current?.abort();
      };
    }

    const interval = setInterval(() => {
      fetchData();
    }, refreshIntervalMs);

    return () => {
      clearInterval(interval);
      abortController.current?.abort();
    };
  }, [fetchData, refreshIntervalMs]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    hasData: Boolean(data),
  };
}

export default usePlatformOverview;
