import { Client, AccountId, PrivateKey, Hbar } from "@hashgraph/sdk";

class HederaClient {
  private client: Client | null = null;
  private static instance: HederaClient;

  private constructor() {}

  public static getInstance(): HederaClient {
    if (!HederaClient.instance) {
      HederaClient.instance = new HederaClient();
    }
    return HederaClient.instance;
  }

  public initializeClient(
    operatorId: string,
    operatorKey: string,
    network: 'testnet' | 'mainnet' | 'previewnet' = 'testnet'
  ): void {
    try {
      const accountId = AccountId.fromString(operatorId);
      const privateKey = PrivateKey.fromString(operatorKey);

      this.client = Client.forName(network);
      this.client.setOperator(accountId, privateKey);
      this.client.setDefaultMaxTransactionFee(new Hbar(2));
      this.client.setMaxQueryPayment(new Hbar(1));

      console.log('Hedera client initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Hedera client:', error);
      throw new Error(`Hedera client initialization failed: ${error.message}`);
    }
  }

  public getClient(): Client | null {
    return this.client;
  }

  public isInitialized(): boolean {
    return this.client !== null;
  }
}

export const hederaClient = HederaClient.getInstance();
