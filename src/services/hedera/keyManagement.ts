import { PrivateKey, PublicKey } from '@hashgraph/sdk';

export interface GeneratedKey {
  privateKey: string;
  publicKey: string;
}

export class KeyManagementService {
  /**
   * Generate a new ED25519 key pair
   */
  generateKey(): GeneratedKey {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;

    return {
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString()
    };
  }

  /**
   * Generate multiple keys at once
   */
  generateKeys(count: number): GeneratedKey[] {
    const keys: GeneratedKey[] = [];
    for (let i = 0; i < count; i++) {
      keys.push(this.generateKey());
    }
    return keys;
  }

  /**
   * Get public key from private key string
   */
  getPublicKeyFromPrivate(privateKeyString: string): string {
    const privateKey = PrivateKey.fromString(privateKeyString);
    return privateKey.publicKey.toString();
  }

  /**
   * Validate if a string is a valid private key
   */
  isValidPrivateKey(keyString: string): boolean {
    try {
      PrivateKey.fromString(keyString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate if a string is a valid public key
   */
  isValidPublicKey(keyString: string): boolean {
    try {
      PublicKey.fromString(keyString);
      return true;
    } catch {
      return false;
    }
  }
}

export const keyManagementService = new KeyManagementService();
