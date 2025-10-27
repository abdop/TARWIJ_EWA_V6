import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  CustomFractionalFee,
  PrivateKey,
  PublicKey,
  AccountId,
  ContractId,
  Hbar,
  KeyList,
  AccountInfoQuery,
} from "@hashgraph/sdk";
import { hederaClient } from "./client";
import { smartContractService } from "./smartContract";
import { dataService } from "../data/dataService";
import {
  getEnterpriseRepository,
  getUserRepository,
  getEnterpriseTokenRepository,
  getDltOperationRepository,
} from "../../repositories/RepositoryFactory";
import { Enterprise } from "../../repositories/IEnterpriseRepository";
import { User } from "../../repositories/IUserRepository";
import { EnterpriseToken } from "../../repositories/IEnterpriseTokenRepository";

export interface EnterpriseInfo {
  name: string;
  symbol: string;
  address: string;
  contactEmail: string;
  bankAccount: string;
  industry: string;
  tokenName: string;
  tokenSymbol: string;
  settlementDay: number; // Day of month for settlement (1-31)
}

export interface UserInfo {
  name: string;
  email: string;
  role: string;
  category: "ent_admin" | "decider";
  hederaAccountId: string;
}

export interface EnterpriseCreationConfig {
  enterpriseInfo: EnterpriseInfo;
  users: UserInfo[];
  platformTokenId: string;
  platformAdminPrivateKey: string;
  treasuryAccountId: string;
  feeCollectorAccountId: string;
  fractionalFeePercent: number; // e.g., 0.5 for 0.5%
}

export interface EnterpriseCreationResult {
  enterprise: Enterprise;
  users: User[];
  token: EnterpriseToken;
  swapContractId: string;
  transactionIds: {
    contractDeployment: string;
    tokenCreation: string;
    tokenSetOnContract: string;
  };
}

export class EnterpriseManagementService {
  /**
   * Complete workflow to create a new enterprise with token and swap contract
   */
  async createEnterprise(
    config: EnterpriseCreationConfig
  ): Promise<EnterpriseCreationResult> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    console.log("Starting enterprise creation workflow...");
    console.log(`Enterprise: ${config.enterpriseInfo.name}`);

    // Validate users (at least 1 ent_admin and 2 deciders)
    const entAdmins = config.users.filter((u) => u.category === "ent_admin");
    const deciders = config.users.filter((u) => u.category === "decider");

    if (entAdmins.length === 0) {
      throw new Error("At least one enterprise admin is required");
    }

    if (deciders.length < 2) {
      throw new Error("At least two deciders are required");
    }

    // Step 1: Deploy SimpleEnterpriseTokenSwap contract
    console.log("\n[1/5] Deploying swap contract...");
    const swapDeployment = await smartContractService.deploySwapContract(
      config.platformTokenId,
      config.platformAdminPrivateKey
    );

    console.log(`✓ Swap contract deployed: ${swapDeployment.contractId}`);

    // Step 2: Create enterprise record
    console.log("\n[2/5] Creating enterprise record...");
    const enterpriseId = dataService.generateId("ent");
    const enterprise: Enterprise = {
      id: enterpriseId,
      name: config.enterpriseInfo.name,
      symbol: config.enterpriseInfo.symbol,
      address: config.enterpriseInfo.address,
      contactEmail: config.enterpriseInfo.contactEmail,
      bankAccount: config.enterpriseInfo.bankAccount,
      industry: config.enterpriseInfo.industry,
    };

    const enterpriseRepo = getEnterpriseRepository();
    await enterpriseRepo.create(enterprise);
    console.log(`✓ Enterprise created: ${enterpriseId}`);

    // Step 3: Create user records
    console.log("\n[3/5] Creating user records...");
    const userRepo = getUserRepository();
    const createdUsers: User[] = [];

    for (const userInfo of config.users) {
      const userId = dataService.generateId("user");
      const user: User = {
        id: userId,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role,
        category: userInfo.category,
        entrepriseId: enterpriseId,
        hedera_id: userInfo.hederaAccountId,
      };

      await userRepo.create(user);
      createdUsers.push(user);
      console.log(`✓ User created: ${user.name} (${user.category})`);
    }

    // Step 4: Create enterprise token with contract as delete key
    console.log("\n[4/5] Creating enterprise token...");
    const adminPrivateKey = PrivateKey.fromString(
      config.platformAdminPrivateKey
    );
    const adminPublicKey = adminPrivateKey.publicKey;

    // Get contract ID for delete key
    const contractId = ContractId.fromString(swapDeployment.contractId);

    // Get all decider public keys for supply key
    console.log("Fetching decider public keys...");
    const tokenDeciders = createdUsers.filter((u) => u.category === "decider");
    const deciderPublicKeys: PublicKey[] = [];

    for (const decider of tokenDeciders) {
      try {
        const accountInfo = await new AccountInfoQuery()
          .setAccountId(decider.hedera_id)
          .execute(client);
        const publicKey = accountInfo.key;
        
        if (publicKey instanceof PublicKey) {
          deciderPublicKeys.push(publicKey);
          console.log(`✓ Fetched public key for decider: ${decider.name}`);
        } else {
          console.warn(`⚠ Decider ${decider.name} has non-standard key type`);
        }
      } catch (error) {
        console.error(`Failed to fetch public key for decider ${decider.name}:`, error);
        throw error;
      }
    }

    // Create KeyList with threshold = number of deciders (all must sign)
    const supplyKeyList = new KeyList(deciderPublicKeys, tokenDeciders.length);
    console.log(`✓ Created supply KeyList with ${tokenDeciders.length} decider keys (threshold: ${tokenDeciders.length})`);

    // Create custom fractional fee
    const customFee = new CustomFractionalFee()
      .setNumerator(Math.round(config.fractionalFeePercent * 10)) // e.g., 0.5% = 5/1000
      .setDenominator(1000)
      .setFeeCollectorAccountId(
        AccountId.fromString(config.feeCollectorAccountId)
      );

    // Create token memo with settlement day
    // Note: Hedera memo limit is 100 bytes, keep it short
    const tokenMemo = `SettlementDay:${config.enterpriseInfo.settlementDay}`;

    // Create token transaction
    // Note: Contract as wipe key (not delete key, as setDeleteKey doesn't exist in SDK)
    // Supply key is a KeyList of all decider public keys with threshold = number of deciders
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(config.enterpriseInfo.tokenName)
      .setTokenSymbol(config.enterpriseInfo.tokenSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(0)
      .setTreasuryAccountId(AccountId.fromString(config.treasuryAccountId))
      .setSupplyType(TokenSupplyType.Infinite)
      .setAdminKey(adminPublicKey)
      .setSupplyKey(supplyKeyList) // KeyList with all decider public keys
      .setWipeKey(contractId) // Contract as wipe key for swap functionality
      .setFreezeKey(adminPublicKey)
      .setPauseKey(adminPublicKey)
      .setFeeScheduleKey(adminPublicKey)
      .setTokenMemo(tokenMemo)
      .setCustomFees([customFee])
      .setMaxTransactionFee(new Hbar(50))
      .freezeWith(client);

    // Sign with admin key
    const signedTx = await tokenCreateTx.sign(adminPrivateKey);

    // Execute transaction
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const tokenId = receipt.tokenId;

    if (!tokenId) {
      throw new Error("Token creation failed - no token ID returned");
    }

    console.log(`✓ Token created: ${tokenId.toString()}`);

    // Create enterprise token record
    const enterpriseToken: EnterpriseToken = {
      entrepriseId: enterpriseId,
      tokenId: tokenId.toString(),
      symbol: config.enterpriseInfo.tokenSymbol,
      name: config.enterpriseInfo.tokenName,
      totalSupply: "0",
      decimals: 2,
      treasuryAccountId: config.treasuryAccountId,
      adminAccountId: config.treasuryAccountId,
      feeCollectorAccountId: config.feeCollectorAccountId,
      fractionalFee: config.fractionalFeePercent / 100,
      createdAt: new Date().toISOString(),
      transactionId: txResponse.transactionId.toString(),
      id: dataService.generateId("token"),
      swapContractId: swapDeployment.contractId,
      settlementDay: config.enterpriseInfo.settlementDay,
      supplyKeyList: deciderPublicKeys.map((key) => key.toString()),
      supplyKeyThreshold: tokenDeciders.length,
    };

    const tokenRepo = getEnterpriseTokenRepository();
    await tokenRepo.create(enterpriseToken);

    // Log token creation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_CREATE",
      status: "SUCCESS",
      userId: config.treasuryAccountId,
      entrepriseId: enterpriseId,
      tokenId: tokenId.toString(),
      details: {
        entrepriseName: config.enterpriseInfo.tokenName,
        entrepriseSymbol: config.enterpriseInfo.tokenSymbol,
        treasuryAccountId: config.treasuryAccountId,
        feeCollectorAccountId: config.feeCollectorAccountId,
        initialSupply: "0",
        decimals: 2,
        fractionalFee: config.fractionalFeePercent,
        tokenId: tokenId.toString(),
        transactionId: txResponse.transactionId.toString(),
        swapContractId: swapDeployment.contractId,
        settlementDay: config.enterpriseInfo.settlementDay,
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    // Step 5: Set enterprise token on swap contract
    console.log("\n[5/5] Setting token on swap contract...");
    const setTokenResult = await smartContractService.setEnterpriseToken(
      swapDeployment.contractId,
      tokenId.toString(),
      config.platformAdminPrivateKey
    );

    console.log(`✓ Token set on contract`);

    // Log contract configuration
    await dltOpRepo.create({
      type: "CONTRACT_CONFIGURE",
      status: "SUCCESS",
      userId: config.treasuryAccountId,
      entrepriseId: enterpriseId,
      tokenId: tokenId.toString(),
      details: {
        contractId: swapDeployment.contractId,
        enterpriseTokenId: tokenId.toString(),
        platformTokenId: config.platformTokenId,
        transactionId: setTokenResult.transactionId,
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: setTokenResult.transactionId,
      completedAt: new Date().toISOString(),
    });

    console.log("\n✨ Enterprise creation complete!");

    return {
      enterprise,
      users: createdUsers,
      token: enterpriseToken,
      swapContractId: swapDeployment.contractId,
      transactionIds: {
        contractDeployment: swapDeployment.transactionId,
        tokenCreation: txResponse.transactionId.toString(),
        tokenSetOnContract: setTokenResult.transactionId,
      },
    };
  }

  /**
   * Get all enterprises
   */
  async getAllEnterprises(): Promise<Enterprise[]> {
    const enterpriseRepo = getEnterpriseRepository();
    return enterpriseRepo.findAll();
  }

  /**
   * Get enterprise by ID
   */
  async getEnterpriseById(id: string): Promise<Enterprise | undefined> {
    const enterpriseRepo = getEnterpriseRepository();
    return enterpriseRepo.findById(id);
  }

  /**
   * Get users for an enterprise
   */
  async getEnterpriseUsers(enterpriseId: string): Promise<User[]> {
    const userRepo = getUserRepository();
    return userRepo.findByEnterprise(enterpriseId);
  }

  /**
   * Get token for an enterprise
   */
  async getEnterpriseToken(
    enterpriseId: string
  ): Promise<EnterpriseToken | undefined> {
    const tokenRepo = getEnterpriseTokenRepository();
    return tokenRepo.findByEnterpriseId(enterpriseId);
  }
}

export const enterpriseManagementService = new EnterpriseManagementService();
