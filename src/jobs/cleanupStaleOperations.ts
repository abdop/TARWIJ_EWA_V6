import { getDltOperationRepository } from '../repositories/RepositoryFactory';
import type { DltOperation } from '../repositories/IDltOperationRepository';

const STALE_TYPES = ['SHOP_ACCEPT_TOKEN_PREPARED', 'SHOP_TOKEN_ASSOCIATE_PREPARED'];
const STALE_STATUSES = ['PENDING_SIGNATURE'];
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export interface CleanupResult {
  checked: number;
  expired: number;
  details: {
    id: string;
    type: string;
    createdAt: string;
    message: string;
  }[];
}

export const cleanupStaleOperations = async (): Promise<CleanupResult> => {
  const repo = getDltOperationRepository();
  const result: CleanupResult = {
    checked: 0,
    expired: 0,
    details: [],
  };

  const now = Date.now();

  for (const status of STALE_STATUSES) {
    const candidates = await repo.findByStatus(status);

    for (const operation of candidates) {
      if (!STALE_TYPES.includes(operation.type)) continue;

      result.checked += 1;

      const createdAt = new Date(operation.createdAt).getTime();
      const age = now - createdAt;

      if (age > STALE_THRESHOLD_MS) {
        try {
          await repo.update(operation.id, {
            status: 'ERROR',
            completedAt: new Date().toISOString(),
            details: {
              ...(operation.details ?? {}),
              message: 'Operation expired - wallet signature not completed within time limit',
            },
          });

          result.expired += 1;
          result.details.push({
            id: operation.id,
            type: operation.type,
            createdAt: operation.createdAt,
            message: 'Marked as expired',
          });
        } catch (error: any) {
          console.error(`Failed to expire operation ${operation.id}:`, error);
        }
      }
    }
  }

  return result;
};
