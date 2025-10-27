import {
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  ContractId,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";
import { hederaClient } from "./client";
import fs from "fs";
import path from "path";

/**
 * Helper to convert token ID to Solidity address
 */
function tokenIdToSolidityAddress(tokenId: string): string {
  const [shard, realm, num] = tokenId.split(".").map(Number);
  return "0x" + num.toString(16).padStart(40, "0");
}

export interface SwapContractDeploymentResult {
  contractId: string;
  transactionId: string;
  platformTokenId: string;
  platformTokenAddress: string;
}

export interface EnterpriseTokenSetResult {
  transactionId: string;
  enterpriseTokenId: string;
  enterpriseTokenAddress: string;
}

export class SmartContractService {
  /**
   * Deploy SimpleEnterpriseTokenSwap contract
   */
  async deploySwapContract(
    platformTokenId: string,
    adminPrivateKey: string
  ): Promise<SwapContractDeploymentResult> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const adminKey = PrivateKey.fromString(adminPrivateKey);

    // Read compiled contract bytecode
    const contractPath = path.join(
      process.cwd(),
      "artifacts/contracts/SimpleEnterpriseTokenSwap.sol/SimpleEnterpriseTokenSwap.json"
    );

    if (!fs.existsSync(contractPath)) {
      throw new Error(
        `Contract artifact not found at ${contractPath}. Please compile contracts first.`
      );
    }

    const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const contractBytecode = contractJson.bytecode;

    // Convert platform token ID to Solidity address
    const platformTokenAddress = tokenIdToSolidityAddress(platformTokenId);

    console.log("Deploying SimpleEnterpriseTokenSwap contract...");
    console.log(`Platform Token: ${platformTokenId}`);
    console.log(`Platform Token Address: ${platformTokenAddress}`);

    // Deploy contract using ContractCreateFlow
    // Note: ContractCreateFlow automatically handles chunking for large bytecode
    // Maximum gas per transaction on Hedera is ~15M, so we use 10M to be safe
    const contractCreate = new ContractCreateFlow()
      .setGas(10000000) // 10M gas - safe limit for contract deployment
      .setBytecode(contractBytecode)
      .setConstructorParameters(
        new ContractFunctionParameters().addAddress(platformTokenAddress)
      );

    // Execute with explicit max transaction fee on the client
    const originalMaxFee = client.defaultMaxTransactionFee;
    client.setDefaultMaxTransactionFee(new Hbar(50));

    const contractCreateSubmit = await contractCreate.execute(client);
    const contractCreateReceipt = await contractCreateSubmit.getReceipt(client);
    const contractId = contractCreateReceipt.contractId;

    // Restore original max fee
    if (originalMaxFee) {
      client.setDefaultMaxTransactionFee(originalMaxFee);
    }

    if (!contractId) {
      throw new Error("Failed to deploy contract");
    }

    console.log(`Contract deployed: ${contractId.toString()}`);

    return {
      contractId: contractId.toString(),
      transactionId: contractCreateSubmit.transactionId.toString(),
      platformTokenId,
      platformTokenAddress,
    };
  }

  /**
   * Set enterprise token on the swap contract
   */
  async setEnterpriseToken(
    contractId: string,
    enterpriseTokenId: string,
    adminPrivateKey: string
  ): Promise<EnterpriseTokenSetResult> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const adminKey = PrivateKey.fromString(adminPrivateKey);

    // Convert enterprise token ID to Solidity address
    const enterpriseTokenAddress = tokenIdToSolidityAddress(enterpriseTokenId);

    console.log("Setting enterprise token on swap contract...");
    console.log(`Contract ID: ${contractId}`);
    console.log(`Enterprise Token: ${enterpriseTokenId}`);
    console.log(`Enterprise Token Address: ${enterpriseTokenAddress}`);

    // Verify admin access
    const adminQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000) // Queries need much less gas
      .setFunction("getAdmin")
      .setMaxQueryPayment(new Hbar(1));

    const adminResult = await adminQuery.execute(client);
    const currentAdmin = "0x" + adminResult.getAddress(0);
    console.log(`Current Admin: ${currentAdmin}`);

    // Set enterprise token
    const setTokenTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000) // 1M gas for contract execution
      .setFunction(
        "setEnterpriseToken",
        new ContractFunctionParameters().addAddress(enterpriseTokenAddress)
      )
      .setMaxTransactionFee(new Hbar(10)); // Set max transaction fee

    const setTokenSubmit = await setTokenTx.execute(client);
    const setTokenReceipt = await setTokenSubmit.getReceipt(client);

    console.log("Enterprise token set successfully!");
    console.log(`Transaction ID: ${setTokenSubmit.transactionId.toString()}`);

    // Verify the token was set
    const tokenQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000) // Queries need much less gas
      .setFunction("getEnterpriseToken")
      .setMaxQueryPayment(new Hbar(1));

    const tokenResult = await tokenQuery.execute(client);
    const setTokenAddress = "0x" + tokenResult.getAddress(0);

    if (
      setTokenAddress.toLowerCase() !== enterpriseTokenAddress.toLowerCase()
    ) {
      throw new Error("Token address verification failed");
    }

    return {
      transactionId: setTokenSubmit.transactionId.toString(),
      enterpriseTokenId,
      enterpriseTokenAddress,
    };
  }

  /**
   * Get contract admin address
   */
  async getContractAdmin(contractId: string): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const adminQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000) // Queries need much less gas
      .setFunction("getAdmin")
      .setMaxQueryPayment(new Hbar(1));

    const adminResult = await adminQuery.execute(client);
    return "0x" + adminResult.getAddress(0);
  }

  /**
   * Get enterprise token address from contract
   */
  async getEnterpriseToken(contractId: string): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const tokenQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000) // Queries need much less gas
      .setFunction("getEnterpriseToken")
      .setMaxQueryPayment(new Hbar(1));

    const tokenResult = await tokenQuery.execute(client);
    return "0x" + tokenResult.getAddress(0);
  }

  /**
   * Get platform token address from contract
   */
  async getPlatformToken(contractId: string): Promise<string> {
    const client = hederaClient.getClient();
    if (!client) {
      throw new Error("Hedera client not initialized");
    }

    const tokenQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100000) // Queries need much less gas
      .setFunction("getPlatformToken")
      .setMaxQueryPayment(new Hbar(1));

    const tokenResult = await tokenQuery.execute(client);
    return "0x" + tokenResult.getAddress(0);
  }
}

export const smartContractService = new SmartContractService();
