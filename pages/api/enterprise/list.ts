import type { NextApiRequest, NextApiResponse } from "next";
import { enterpriseManagementService } from "../../../src/services/hedera/enterpriseManagement";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const enterprises = await enterpriseManagementService.getAllEnterprises();

    // Get token info for each enterprise
    const enterprisesWithTokens = await Promise.all(
      enterprises.map(async (enterprise) => {
        const token = await enterpriseManagementService.getEnterpriseToken(
          enterprise.id
        );
        const users = await enterpriseManagementService.getEnterpriseUsers(
          enterprise.id
        );

        return {
          ...enterprise,
          token: token
            ? {
                tokenId: token.tokenId,
                symbol: token.symbol,
                name: token.name,
                swapContractId: token.swapContractId,
                settlementDay: token.settlementDay,
              }
            : null,
          userCount: users.length,
          adminCount: users.filter((u) => u.category === "ent_admin").length,
          deciderCount: users.filter((u) => u.category === "decider").length,
          employeeCount: users.filter((u) => u.category === "employee").length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enterprisesWithTokens,
    });
  } catch (error: any) {
    console.error("Enterprise list error:", error);
    return res.status(500).json({
      error: "Failed to fetch enterprises",
      details: error.message,
    });
  }
}
