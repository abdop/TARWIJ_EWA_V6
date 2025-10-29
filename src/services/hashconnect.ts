import { HashConnect } from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";

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

  // Pass accountId as string to avoid SDK version conflicts
  const result = await instance.signTransaction(
    accountIdForSigning as any,
    transaction
  );
  return result;
};

export const executeTransaction = async (
  accountIdForSigning: string,
  transaction: any
) => {
  const instance = getHashConnectInstance();
  // Pass accountId as string to avoid SDK version conflicts
  const result = await instance.sendTransaction(
    accountIdForSigning as any,
    transaction
  );
  return result;
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

  // Pass accountId as string to avoid SDK version conflicts
  const result = await instance.signMessages(
    accountIdForSigning as any,
    message
  );
  return result;
};
