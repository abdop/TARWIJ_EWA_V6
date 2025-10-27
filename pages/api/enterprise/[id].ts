import type { NextApiRequest, NextApiResponse } from "next";
import { enterpriseManagementService } from "../../../src/services/hedera/enterpriseManagement";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid enterprise ID" });
  }

  if (req.method === "GET") {
    try {
      const enterprise = await enterpriseManagementService.getEnterpriseById(id);

      if (!enterprise) {
        return res.status(404).json({ error: "Enterprise not found" });
      }

      const token = await enterpriseManagementService.getEnterpriseToken(id);
      const users = await enterpriseManagementService.getEnterpriseUsers(id);

      return res.status(200).json({
        success: true,
        data: {
          ...enterprise,
          token: token
            ? {
                tokenId: token.tokenId,
                symbol: token.symbol,
                name: token.name,
                swapContractId: token.swapContractId,
                settlementDay: token.settlementDay,
                treasuryAccountId: token.treasuryAccountId,
                feeCollectorAccountId: token.feeCollectorAccountId,
                fractionalFee: token.fractionalFee,
                createdAt: token.createdAt,
              }
            : null,
          users: users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            category: u.category,
            hederaAccountId: u.hedera_id,
          })),
        },
      });
    } catch (error: any) {
      console.error("Enterprise fetch error:", error);
      return res.status(500).json({
        error: "Failed to fetch enterprise",
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
