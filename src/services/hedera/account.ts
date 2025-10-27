import { AccountId, PrivateKey, Hbar, AccountInfoQuery, TransferTransaction } from "@hashgraph/sdk";
import { hederaClient } from "./client";

export class HederaAccountService {
  /**
   * Get account balance
   * @param accountId The account ID to check balance for
   * @returns Account balance in tinybars
   */
  public static async getAccountBalance(accountId: string): Promise<number> {
    try {
      const client = hederaClient.getClient();
      const query = new AccountInfoQuery()
        .setAccountId(accountId);
      
      const accountInfo = await query.execute(client);
      return Number(accountInfo.balance.toTinybars());
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Transfer hbars between accounts
   * @param fromAccountId Sender account ID
   * @param fromPrivateKey Sender private key
   * @param toAccountId Receiver account ID
   * @param amount Amount in hbars
   * @returns Transaction ID
   */
  public static async transferHbar(
    fromAccountId: string,
    fromPrivateKey: string,
    toAccountId: string,
    amount: number
  ): Promise<string> {
    try {
      const client = hederaClient.getClient();
      const privateKey = PrivateKey.fromString(fromPrivateKey);
      
      const transaction = await new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(fromAccountId), new Hbar(-amount))
        .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amount))
        .freezeWith(client);
      
      const signedTx = await transaction.sign(privateKey);
      const response = await signedTx.execute(client);
      const receipt = await response.getReceipt(client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error transferring hbar:', error);
      throw new Error(`Failed to transfer hbar: ${error.message}`);
    }
  }

  /**
   * Get account info
   * @param accountId The account ID to get info for
   * @returns Account information
   */
  public static async getAccountInfo(accountId: string) {
    try {
      const client = hederaClient.getClient();
      const query = new AccountInfoQuery()
        .setAccountId(accountId);
      
      const accountInfo = await query.execute(client);
      
      return {
        accountId: accountInfo.accountId.toString(),
        balance: accountInfo.balance.toString(),
        isDeleted: accountInfo.isDeleted,
        key: accountInfo.key.toString(),
        receiverSignatureRequired: accountInfo.receiverSignatureRequired,
        expirationTime: accountInfo.expirationTime,
        autoRenewPeriod: accountInfo.autoRenewPeriod.toString(),
        alias: accountInfo.alias ? accountInfo.alias.toString() : null,
        ethereumNonce: accountInfo.ethereumNonce?.toString()
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }
}
