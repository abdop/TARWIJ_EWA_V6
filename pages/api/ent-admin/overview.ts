import type { NextApiRequest, NextApiResponse } from "next";
import {
  getEnterpriseRepository,
  getUserRepository,
  getEnterpriseTokenRepository,
  getWageAdvanceRepository,
  getDltOperationRepository,
} from "../../../src/repositories/RepositoryFactory";

const formatNumber = (value: string | number | undefined | null, decimals = 2) => {
  if (value === undefined || value === null) {
    return 0;
  }
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number(numeric.toFixed(decimals));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { enterpriseId } = req.query;

  if (!enterpriseId || typeof enterpriseId !== "string") {
    return res.status(400).json({ success: false, error: "Missing enterpriseId" });
  }

  try {
    const enterpriseRepo = getEnterpriseRepository();
    const userRepo = getUserRepository();
    const tokenRepo = getEnterpriseTokenRepository();
    const wageRepo = getWageAdvanceRepository();
    const dltRepo = getDltOperationRepository();

    const [enterprise, employees, token, wageRequests, dltOperations] = await Promise.all([
      enterpriseRepo.findById(enterpriseId),
      userRepo.findByEnterprise(enterpriseId),
      tokenRepo.findByEnterpriseId(enterpriseId),
      wageRepo.findByEnterprise(enterpriseId),
      dltRepo.findByEnterprise(enterpriseId),
    ]);

    if (!enterprise) {
      return res.status(404).json({ success: false, error: "Enterprise not found" });
    }

    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));

    const pendingRequests = wageRequests.filter((request) =>
      ["pending", "pending_signature"].includes(request.status)
    );
    const completedRequests = wageRequests.filter((request) =>
      ["completed", "approved"].includes(request.status)
    );
    const rejectedRequests = wageRequests.filter((request) => request.status === "rejected");

    const totalAdvanced = completedRequests.reduce((sum, request) => sum + request.requestedAmount, 0);
    const totalPending = pendingRequests.reduce((sum, request) => sum + request.requestedAmount, 0);

    const employeeSummaries = employees.map((employee) => {
      const requests = wageRequests.filter((request) => request.employeeId === employee.id);
      const completedForEmployee = requests.filter((request) =>
        ["completed", "approved"].includes(request.status)
      );
      const pendingForEmployee = requests.filter((request) =>
        ["pending", "pending_signature"].includes(request.status)
      );

      const lifetimeAdvanced = completedForEmployee.reduce(
        (sum, request) => sum + request.requestedAmount,
        0
      );
      const pendingAmount = pendingForEmployee.reduce(
        (sum, request) => sum + request.requestedAmount,
        0
      );

      const lastRequest = [...requests]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        )[0];

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        category: employee.category,
        accountId: employee.hedera_id,
        status: "active",
        lifetimeAdvanced,
        pendingAmount,
        requestCount: requests.length,
        lastRequestAt: lastRequest ? lastRequest.updatedAt || lastRequest.createdAt : null,
      };
    });

    const recentActivity = [...dltOperations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((operation) => ({
        id: operation.id,
        type: operation.type,
        status: operation.status,
        createdAt: operation.createdAt,
        details: operation.details,
      }));

    const wageHistory = [...completedRequests, ...rejectedRequests]
      .sort((a, b) =>
        new Date(b.completedAt || b.updatedAt).getTime() -
        new Date(a.completedAt || a.updatedAt).getTime()
      )
      .slice(0, 20)
      .map((request) => ({
        id: request.id,
        employeeId: request.employeeId,
        employeeName: employeeMap.get(request.employeeId)?.name || "Unknown",
        employeeEmail: employeeMap.get(request.employeeId)?.email || "",
        amount: request.requestedAmount,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        completedAt: request.completedAt ?? null,
        rejectedBy: request.rejectedBy ?? null,
        rejectionReason: request.rejectionReason ?? null,
      }));

    const transactions = wageRequests
      .map((request) => ({
        id: request.id,
        type:
          request.status === "pending" || request.status === "pending_signature"
            ? "request"
            : request.status === "rejected"
            ? "rejection"
            : "transfer",
        amount: request.requestedAmount,
        from: token?.treasuryAccountId ?? null,
        to: employeeMap.get(request.employeeId)?.hedera_id ?? null,
        status: request.status,
        timestamp: request.updatedAt || request.createdAt,
        employeeName: employeeMap.get(request.employeeId)?.name || "Unknown",
      }))
      .concat(
        dltOperations.map((operation) => ({
          id: operation.id,
          type: operation.type,
          amount: operation.details?.requestedAmount || operation.details?.amount || null,
          from: operation.details?.from || null,
          to: operation.details?.to || null,
          status: operation.status,
          timestamp: operation.createdAt,
          employeeName: operation.details?.employeeName || null,
        }))
      )
      .sort((a, b) => new Date(b.timestamp || "").getTime() - new Date(a.timestamp || "").getTime())
      .slice(0, 30);

    const stats = {
      totalEmployees: employees.length,
      adminCount: employees.filter((emp) => emp.category === "ent_admin").length,
      deciderCount: employees.filter((emp) => emp.category === "decider").length,
      employeeCount: employees.filter((emp) => emp.category === "employee").length,
      pendingRequests: pendingRequests.length,
      totalRequests: wageRequests.length,
      totalWageAdvanced: totalAdvanced,
      pendingAmount: totalPending,
    };

    const tokenMetrics = token
      ? {
          tokenId: token.tokenId,
          symbol: token.symbol,
          name: token.name,
          totalSupply: formatNumber(token.totalSupply),
          decimals: token.decimals,
          treasuryBalance:
            token.decimals && token.decimals > 0
              ? formatNumber(Number(token.totalSupply) / Math.pow(10, token.decimals))
              : formatNumber(token.totalSupply),
          fractionalFee: token.fractionalFee,
          treasuryAccountId: token.treasuryAccountId,
          feeCollectorAccountId: token.feeCollectorAccountId,
          settlementDay: token.settlementDay ?? null,
          supplyKeyThreshold: token.supplyKeyThreshold ?? null,
          supplyKeyList: token.supplyKeyList ?? [],
          createdAt: token.createdAt,
        }
      : null;

    return res.status(200).json({
      success: true,
      data: {
        enterprise,
        token: tokenMetrics,
        stats,
        employees: employeeSummaries,
        pendingRequests: pendingRequests
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((request) => ({
            id: request.id,
            employeeId: request.employeeId,
            employeeName: employeeMap.get(request.employeeId)?.name || "Unknown",
            amount: request.requestedAmount,
            status: request.status,
            createdAt: request.createdAt,
          })),
        wageHistory,
        recentActivity,
        transactions,
      },
    });
  } catch (error: any) {
    console.error("Enterprise overview error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load overview" });
  }
}
