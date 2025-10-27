import type { NextApiRequest, NextApiResponse } from "next";
import { enterpriseManagementService } from "../../../src/services/hedera/enterpriseManagement";
import { hederaClient } from "../../../src/services/hedera/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { enterpriseInfo, users } = req.body;

    // Validate required fields from request
    if (!enterpriseInfo || !users) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get platform configuration from environment (backend only)
    const platformTokenId = process.env.PLATFORM_STABLECOIN_TOKEN_ID;
    const platformAdminPrivateKey = process.env.HEDERA_OPERATOR_KEY;
    const treasuryAccountId = process.env.HEDERA_OPERATOR_ID;
    const feeCollectorAccountId = process.env.HEDERA_OPERATOR_ID;
    const fractionalFeePercent = 0.5; // Fixed at 0.5% for all enterprise tokens

    // Validate backend configuration
    if (
      !platformTokenId ||
      !platformAdminPrivateKey ||
      !treasuryAccountId ||
      !feeCollectorAccountId
    ) {
      console.error("Missing backend configuration:", {
        hasPlatformTokenId: !!platformTokenId,
        hasAdminKey: !!platformAdminPrivateKey,
        hasTreasuryId: !!treasuryAccountId,
        hasFeeCollectorId: !!feeCollectorAccountId,
      });
      return res.status(500).json({
        error:
          "Server configuration error - missing required environment variables",
      });
    }

    // Validate enterprise info
    if (
      !enterpriseInfo.name ||
      !enterpriseInfo.symbol ||
      !enterpriseInfo.address ||
      !enterpriseInfo.contactEmail ||
      !enterpriseInfo.industry ||
      !enterpriseInfo.tokenName ||
      !enterpriseInfo.tokenSymbol ||
      !enterpriseInfo.settlementDay
    ) {
      return res
        .status(400)
        .json({ error: "Incomplete enterprise information" });
    }

    // Validate users
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "At least one user is required" });
    }

    const entAdmins = users.filter((u) => u.category === "ent_admin");
    const deciders = users.filter((u) => u.category === "decider");

    if (entAdmins.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one enterprise admin is required" });
    }

    if (deciders.length < 2) {
      return res
        .status(400)
        .json({ error: "At least two deciders are required" });
    }

    // Initialize Hedera client if not already initialized
    if (!hederaClient.isInitialized()) {
      const network = (process.env.HEDERA_NETWORK || "testnet") as
        | "testnet"
        | "mainnet"
        | "previewnet";
      hederaClient.initializeClient(
        treasuryAccountId,
        platformAdminPrivateKey,
        network
      );
    }

    // Create enterprise
    const result = await enterpriseManagementService.createEnterprise({
      enterpriseInfo,
      users,
      platformTokenId,
      platformAdminPrivateKey,
      treasuryAccountId,
      feeCollectorAccountId,
      fractionalFeePercent,
    });

    return res.status(200).json({
      success: true,
      data: {
        enterprise: result.enterprise,
        users: result.users,
        token: {
          tokenId: result.token.tokenId,
          symbol: result.token.symbol,
          name: result.token.name,
          swapContractId: result.token.swapContractId,
          settlementDay: result.token.settlementDay,
        },
        swapContractId: result.swapContractId,
        transactionIds: result.transactionIds,
      },
    });
  } catch (error: any) {
    console.error("Enterprise creation error:", error);
    return res.status(500).json({
      error: "Failed to create enterprise",
      details: error.message,
    });
  }
}
