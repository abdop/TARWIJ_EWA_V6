import {
  TokenCreateTransaction,
  TokenPauseTransaction,
  TokenUnpauseTransaction,
  TokenFreezeTransaction,
  TokenUnfreezeTransaction,
  TokenWipeTransaction,
  TokenUpdateTransaction,
  PrivateKey,
  PublicKey,
  AccountId,
  TokenType,
  TokenSupplyType,
  CustomFractionalFee,
  KeyList,
  Hbar,
} from "@hashgraph/sdk";
import { hederaClient } from "./client";
import { keyManagementService, GeneratedKey } from "./keyManagement";
import { dataService } from "../data/dataService";
import {
  getUserRepository,
  getEnterpriseRepository,
  getEnterpriseTokenRepository,
  getDltOperationRepository,
} from "../../repositories/RepositoryFactory";
import { EnterpriseToken } from "../../repositories/IEnterpriseTokenRepository";
import { User } from "../../repositories/IUserRepository";

export interface CustomFeeConfig {
  numerator: number;
  denominator: number;
  feeCollectorAccountId: string;
  allCollectorsAreExempt: boolean;
}

export interface EnterpriseTokenConfig {
  enterpriseId: string;
  enterpriseName: string;
  enterpriseSymbol: string;
  adminPrivateKey: string;
  treasuryAccountId: string;
  decimals?: number;
  customFee: CustomFeeConfig;
}

export interface TokenCreationResult {
  tokenId: string;
  transactionId: string;
  enterpriseToken: EnterpriseToken;
  keys: {
    wipeKey: GeneratedKey;
    feeKey: GeneratedKey;
    deleteKey: GeneratedKey;
    freezeKey: GeneratedKey;
    pauseKey: GeneratedKey;
    supplyKeyList: string[];
    supplyKeyThreshold: number;
  };
}

/**
 * Create a custom fractional fee
 */
export function createCustomFee(config: CustomFeeConfig): CustomFractionalFee {
  return new CustomFractionalFee()
    .setNumerator(config.numerator)
    .setDenominator(config.denominator)
    .setFeeCollectorAccountId(
      AccountId.fromString(config.feeCollectorAccountId)
    )
    .setAllCollectorsAreExempt(config.allCollectorsAreExempt);
}

export class EnterpriseTokenService {
  /**
   * Create an enterprise fungible token with custom configuration
   */
  async createEnterpriseToken(
    config: EnterpriseTokenConfig
  ): Promise<TokenCreationResult> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const decimals = config.decimals ?? 2;

    // Get admin private key
    const adminPrivateKey = PrivateKey.fromString(config.adminPrivateKey);
    const adminPublicKey = adminPrivateKey.publicKey;

    // Generate wipe, fee, delete, freeze, and pause keys
    const wipeKey = keyManagementService.generateKey();
    const feeKey = keyManagementService.generateKey();
    const deleteKey = keyManagementService.generateKey();
    const freezeKey = keyManagementService.generateKey();
    const pauseKey = keyManagementService.generateKey();

    // Get all decider users for the enterprise
    const userRepo = getUserRepository();
    const deciderUsers = await userRepo.findByCategory(
      config.enterpriseId,
      "decider"
    );

    if (deciderUsers.length === 0) {
      throw new Error(
        `No decider users found for enterprise ${config.enterpriseId}`
      );
    }

    // Load decider private keys from environment and create public keys
    const supplyPublicKeys: PublicKey[] = [];
    const supplyKeyStrings: string[] = [];

    for (const user of deciderUsers) {
      const privateKeyEnvVar = `${user.id}_PRIVATE_KEY`;
      const privateKeyString = process.env[privateKeyEnvVar];

      if (!privateKeyString) {
        throw new Error(
          `Private key not found for user ${user.id} (${privateKeyEnvVar})`
        );
      }

      const privateKey = PrivateKey.fromString(privateKeyString);
      const publicKey = privateKey.publicKey;
      supplyPublicKeys.push(publicKey);
      supplyKeyStrings.push(publicKey.toString());
    }

    // Create KeyList with threshold = n (total number of deciders)
    const supplyKeyList = new KeyList(supplyPublicKeys, deciderUsers.length);

    // Create custom fractional fee
    const customFee = createCustomFee(config.customFee);

    // Create token transaction
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(config.enterpriseName)
      .setTokenSymbol(config.enterpriseSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(decimals)
      .setInitialSupply(0) // No initial supply
      .setTreasuryAccountId(AccountId.fromString(config.treasuryAccountId))
      .setSupplyType(TokenSupplyType.Infinite) // No max supply
      .setAdminKey(adminPublicKey)
      .setSupplyKey(supplyKeyList)
      .setWipeKey(PublicKey.fromString(wipeKey.publicKey))
      .setFeeScheduleKey(PublicKey.fromString(feeKey.publicKey))
      .setPauseKey(PublicKey.fromString(pauseKey.publicKey))
      .setFreezeKey(PublicKey.fromString(freezeKey.publicKey))
      .setCustomFees([customFee])
      .setMaxTransactionFee(new Hbar(30))
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

    // Create enterprise token record
    const enterpriseToken: EnterpriseToken = {
      entrepriseId: config.enterpriseId,
      tokenId: tokenId.toString(),
      symbol: config.enterpriseSymbol,
      name: config.enterpriseName,
      totalSupply: "0",
      decimals: decimals,
      treasuryAccountId: config.treasuryAccountId,
      adminAccountId: config.treasuryAccountId,
      feeCollectorAccountId: config.customFee.feeCollectorAccountId,
      fractionalFee: config.customFee.numerator / config.customFee.denominator,
      createdAt: new Date().toISOString(),
      transactionId: txResponse.transactionId.toString(),
      id: dataService.generateId("token"),
      wipeKey: wipeKey.privateKey,
      feeKey: feeKey.privateKey,
      deleteKey: deleteKey.privateKey,
      freezeKey: freezeKey.privateKey,
      pauseKey: pauseKey.privateKey,
      supplyKeyList: supplyKeyStrings,
      supplyKeyThreshold: deciderUsers.length,
    };

    // Save to repository
    const tokenRepo = getEnterpriseTokenRepository();
    await tokenRepo.create(enterpriseToken);

    // Create DLT operation record
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_CREATE",
      status: "SUCCESS",
      userId: config.treasuryAccountId,
      entrepriseId: config.enterpriseId,
      tokenId: tokenId.toString(),
      details: {
        entrepriseName: config.enterpriseName,
        entrepriseSymbol: config.enterpriseSymbol,
        treasuryAccountId: config.treasuryAccountId,
        feeCollectorAccountId: config.customFee.feeCollectorAccountId,
        initialSupply: "0",
        decimals: decimals,
        fractionalFee:
          (config.customFee.numerator / config.customFee.denominator) * 100,
        tokenId: tokenId.toString(),
        transactionId: txResponse.transactionId.toString(),
        supplyKeyThreshold: deciderUsers.length,
        deciderCount: deciderUsers.length,
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return {
      tokenId: tokenId.toString(),
      transactionId: txResponse.transactionId.toString(),
      enterpriseToken,
      keys: {
        wipeKey,
        feeKey,
        deleteKey,
        freezeKey,
        pauseKey,
        supplyKeyList: supplyKeyStrings,
        supplyKeyThreshold: deciderUsers.length,
      },
    };
  }

  /**
   * Get enterprise token by enterprise ID
   */
  async getEnterpriseToken(
    enterpriseId: string
  ): Promise<EnterpriseToken | undefined> {
    const tokenRepo = getEnterpriseTokenRepository();
    return tokenRepo.findByEnterpriseId(enterpriseId);
  }

  /**
   * Check if enterprise already has a token
   */
  async hasEnterpriseToken(enterpriseId: string): Promise<boolean> {
    const token = await this.getEnterpriseToken(enterpriseId);
    return token !== undefined;
  }

  /**
   * Pause a token (requires pause key)
   */
  async pauseToken(tokenId: string, adminPrivateKey: string): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const adminKey = PrivateKey.fromString(adminPrivateKey);

    const pauseTx = new TokenPauseTransaction()
      .setTokenId(tokenId)
      .freezeWith(client);

    const signedTx = await pauseTx.sign(adminKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Log operation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_PAUSE",
      status: "SUCCESS",
      userId: client.operatorAccountId?.toString() || "",
      tokenId: tokenId,
      details: {
        tokenId: tokenId,
        transactionId: txResponse.transactionId.toString(),
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return txResponse.transactionId.toString();
  }

  /**
   * Unpause a token (requires pause key)
   */
  async unpauseToken(
    tokenId: string,
    adminPrivateKey: string
  ): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const adminKey = PrivateKey.fromString(adminPrivateKey);

    const unpauseTx = new TokenUnpauseTransaction()
      .setTokenId(tokenId)
      .freezeWith(client);

    const signedTx = await unpauseTx.sign(adminKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Log operation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_UNPAUSE",
      status: "SUCCESS",
      userId: client.operatorAccountId?.toString() || "",
      tokenId: tokenId,
      details: {
        tokenId: tokenId,
        transactionId: txResponse.transactionId.toString(),
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return txResponse.transactionId.toString();
  }

  /**
   * Freeze an account for a token (requires freeze key)
   */
  async freezeAccount(
    tokenId: string,
    accountId: string,
    adminPrivateKey: string
  ): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const adminKey = PrivateKey.fromString(adminPrivateKey);

    const freezeTx = new TokenFreezeTransaction()
      .setTokenId(tokenId)
      .setAccountId(accountId)
      .freezeWith(client);

    const signedTx = await freezeTx.sign(adminKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Log operation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_FREEZE",
      status: "SUCCESS",
      userId: client.operatorAccountId?.toString() || "",
      tokenId: tokenId,
      details: {
        tokenId: tokenId,
        accountId: accountId,
        transactionId: txResponse.transactionId.toString(),
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return txResponse.transactionId.toString();
  }

  /**
   * Unfreeze an account for a token (requires freeze key)
   */
  async unfreezeAccount(
    tokenId: string,
    accountId: string,
    adminPrivateKey: string
  ): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const adminKey = PrivateKey.fromString(adminPrivateKey);

    const unfreezeTx = new TokenUnfreezeTransaction()
      .setTokenId(tokenId)
      .setAccountId(accountId)
      .freezeWith(client);

    const signedTx = await unfreezeTx.sign(adminKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Log operation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_UNFREEZE",
      status: "SUCCESS",
      userId: client.operatorAccountId?.toString() || "",
      tokenId: tokenId,
      details: {
        tokenId: tokenId,
        accountId: accountId,
        transactionId: txResponse.transactionId.toString(),
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return txResponse.transactionId.toString();
  }

  /**
   * Wipe tokens from an account (requires wipe key)
   */
  async wipeTokens(
    tokenId: string,
    accountId: string,
    amount: number,
    wipePrivateKey: string
  ): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const wipeKey = PrivateKey.fromString(wipePrivateKey);

    const wipeTx = new TokenWipeTransaction()
      .setTokenId(tokenId)
      .setAccountId(accountId)
      .setAmount(amount)
      .freezeWith(client);

    const signedTx = await wipeTx.sign(wipeKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Log operation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_WIPE",
      status: "SUCCESS",
      userId: client.operatorAccountId?.toString() || "",
      tokenId: tokenId,
      details: {
        tokenId: tokenId,
        accountId: accountId,
        amount: amount,
        transactionId: txResponse.transactionId.toString(),
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return txResponse.transactionId.toString();
  }

  /**
   * Update token properties (requires admin key)
   */
  async updateToken(
    tokenId: string,
    adminPrivateKey: string,
    updates: {
      tokenName?: string;
      tokenSymbol?: string;
      treasuryAccountId?: string;
      autoRenewAccountId?: string;
      autoRenewPeriod?: number;
    }
  ): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }
    const adminKey = PrivateKey.fromString(adminPrivateKey);

    const updateTx = new TokenUpdateTransaction().setTokenId(tokenId);

    if (updates.tokenName) {
      updateTx.setTokenName(updates.tokenName);
    }
    if (updates.tokenSymbol) {
      updateTx.setTokenSymbol(updates.tokenSymbol);
    }
    if (updates.treasuryAccountId) {
      updateTx.setTreasuryAccountId(
        AccountId.fromString(updates.treasuryAccountId)
      );
    }
    if (updates.autoRenewAccountId) {
      updateTx.setAutoRenewAccountId(
        AccountId.fromString(updates.autoRenewAccountId)
      );
    }
    if (updates.autoRenewPeriod) {
      updateTx.setAutoRenewPeriod(updates.autoRenewPeriod);
    }

    updateTx.freezeWith(client);

    const signedTx = await updateTx.sign(adminKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Log operation
    const dltOpRepo = getDltOperationRepository();
    await dltOpRepo.create({
      type: "TOKEN_UPDATE",
      status: "SUCCESS",
      userId: client.operatorAccountId?.toString() || "",
      tokenId: tokenId,
      details: {
        tokenId: tokenId,
        updates: updates,
        transactionId: txResponse.transactionId.toString(),
      },
      createdAt: new Date().toISOString(),
      id: dataService.generateId("dlt"),
      transactionId: txResponse.transactionId.toString(),
      completedAt: new Date().toISOString(),
    });

    return txResponse.transactionId.toString();
  }
}

export const enterpriseTokenService = new EnterpriseTokenService();
