import { HashConnect } from "hashconnect";
import { AccountId, LedgerId } from "@hashgraph/sdk";

// Configuration
const env = "testnet"; // or "mainnet" for production
const appMetadata = {
  name: "TARWIJ EWA",
  description: "Employee Wage Advance Platform on Hedera",
  icons: [
    typeof window !== "undefined"
      ? window.location.origin + "/favicon.ico"
      : "/favicon.ico",
  ],
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000",
};

// Initialize HashConnect instance (only on client side)
let hc: HashConnect | null = null;
let hcInitPromise: Promise<void> | null = null;

export const initializeHashConnect = () => {
  if (typeof window === "undefined") return null;

  if (!hc) {
    hc = new HashConnect(
      LedgerId.fromString(env),
      "a6b1f01bd871df202acc86882fc440fd", //"bfa190dbe93fcf30377b932b31129d05", // Project ID - replace with your own
      appMetadata,
      true // Debug mode
    );
    hcInitPromise = hc.init();
  }

  return hc;
};

// Initialize HashConnect
export const getInitPromise = (): Promise<void> | null => {
  if (typeof window === "undefined") return null;
  if (!hcInitPromise) {
    initializeHashConnect();
  }
  return hcInitPromise;
};

// Helper functions
export const getHashConnectInstance = (): HashConnect => {
  if (typeof window === "undefined") {
    throw new Error("HashConnect can only be used on client side");
  }

  if (!hc) {
    initializeHashConnect();
  }

  if (!hc) {
    throw new Error("HashConnect not initialized");
  }

  return hc;
};

export const getConnectedAccountIds = () => {
  try {
    const instance = getHashConnectInstance();
    return instance.connectedAccountIds;
  } catch (error) {
    console.error("Error getting connected accounts:", error);
    return [];
  }
};

// Transaction signing functions
export const signTransaction = async (
  accountIdForSigning: string,
  transaction: any
) => {
  const instance = getHashConnectInstance();
  const initPromise = getInitPromise();
  if (initPromise) {
    await initPromise;
  }

  const accountIds = getConnectedAccountIds();
  if (!accountIds || accountIds.length === 0) {
    throw new Error("No connected accounts");
  }

  const result = await instance.signTransaction(
    AccountId.fromString(accountIdForSigning),
    transaction
  );
  return result;
};

export const executeTransaction = async (
  accountIdForSigning: string,
  transaction: any
) => {
  const instance = getHashConnectInstance();
  
  try {
    const result = await instance.sendTransaction(
      AccountId.fromString(accountIdForSigning),
      transaction
    );
    return result;
  } catch (error: any) {
    // Check if it's a HashConnect communication error
    if (error.message?.includes('JSON-RPC') || error.message?.includes('Decoded payload')) {
      throw new Error(
        'Wallet connection error. Please disconnect and reconnect your wallet, then try again.'
      );
    }
    throw error;
  }
};

export const signMessages = async (
  accountIdForSigning: string,
  message: string
) => {
  const instance = getHashConnectInstance();
  const initPromise = getInitPromise();
  if (initPromise) {
    await initPromise;
  }

  const result = await instance.signMessages(
    AccountId.fromString(accountIdForSigning),
    message
  );
  return result;
};
