import { useCallback, useEffect, useRef, useState } from "react";

interface EnterpriseOverviewResponse {
  success: boolean;
  data: EnterpriseOverview;
}

export interface EnterpriseOverview {
  enterprise: Record<string, unknown>;
  token: {
    tokenId: string;
    symbol: string;
    name: string;
    totalSupply: number;
    decimals: number;
    treasuryBalance: number;
    fractionalFee: number;
    treasuryAccountId: string;
    feeCollectorAccountId: string;
    settlementDay: number | null;
    supplyKeyThreshold: number | null;
    supplyKeyList: string[];
    createdAt: string;
  } | null;
  stats: {
    totalEmployees: number;
    adminCount: number;
    deciderCount: number;
    employeeCount: number;
    pendingRequests: number;
    totalRequests: number;
    totalWageAdvanced: number;
    pendingAmount: number;
  };
  employees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    category: string;
    accountId: string;
    status: string;
    lifetimeAdvanced: number;
    pendingAmount: number;
    requestCount: number;
    lastRequestAt: string | null;
  }>;
  pendingRequests: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  wageHistory: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    rejectedBy: string | null;
    rejectionReason: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    details: Record<string, unknown>;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number | null;
    from: string | null;
    to: string | null;
    status: string;
    timestamp: string | null;
    employeeName: string | null;
  }>;
}

interface UseEnterpriseOverviewOptions {
  enabled?: boolean;
  refreshIntervalMs?: number;
}

export function useEnterpriseOverview(
  enterpriseId?: string,
  { enabled = true, refreshIntervalMs }: UseEnterpriseOverviewOptions = {}
) {
  const [data, setData] = useState<EnterpriseOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enterpriseId || !enabled) {
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ent-admin/overview?enterpriseId=${encodeURIComponent(enterpriseId)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`Failed to load enterprise overview (status ${response.status})`);
      }

      const payload = (await response.json()) as EnterpriseOverviewResponse;
      if (!payload.success) {
        throw new Error("Enterprise overview request failed");
      }

      setData(payload.data);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return;
      }
      setError((err as Error).message || "Failed to load enterprise overview");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enterpriseId, enabled]);

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

export interface EmployeeOverviewSummary {
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
    entrepriseId: string;
    accountId: string;
  };
  stats: {
    totalRequests: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    lifetimeAdvanced: number;
    currentBalance: number;
    totalShopPayments: number;
    pendingAmount: number;
    lastRequestAt: string | null;
  };
  token: {
    tokenId: string;
    symbol: string;
    name: string;
    decimals: number;
    treasuryAccountId: string;
  } | null;
  requests: Array<{
    id: string;
    requestedAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    rejectionReason: string | null;
  }>;
  pendingRequests: Array<{
    id: string;
    requestedAmount: number;
    status: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    details: Record<string, unknown>;
    transactionId: string | null;
  }>;
}

interface EmployeeOverviewResponse {
  success: boolean;
  data: EmployeeOverviewSummary;
}

interface UseEmployeeOverviewOptions {
  enabled?: boolean;
  refreshIntervalMs?: number;
}

export function useEmployeeOverview(
  accountId?: string | null,
  { enabled = true, refreshIntervalMs }: UseEmployeeOverviewOptions = {}
) {
  const [data, setData] = useState<EmployeeOverviewSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!accountId || !enabled) {
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ accountId });
      const response = await fetch(`/api/employee/overview?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load employee overview (status ${response.status})`);
      }

      const payload = (await response.json()) as EmployeeOverviewResponse;
      if (!payload.success) {
        throw new Error('Employee overview request failed');
      }

      setData(payload.data);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('useEmployeeOverview error:', err);
      setError((err as Error).message || 'Failed to load employee overview');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, enabled]);

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

export default useEnterpriseOverview;
