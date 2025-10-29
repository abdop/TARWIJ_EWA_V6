import { getDltOperationRepository } from '../repositories/RepositoryFactory';
import type { DltOperation } from '../repositories/IDltOperationRepository';
import { fetchMirrorTransaction } from '../services/hedera/mirror';

const POLLABLE_TYPES = ['SHOP_ACCEPT_TOKEN_PREPARED'];
const POLLABLE_STATUSES = ['PENDING_CONFIRMATION', 'PENDING_SIGNATURE'];

const timestampToIsoString = (consensusTimestamp?: string): string | undefined => {
  if (!consensusTimestamp) return undefined;
  const [secondsPart, nanosPart = '0'] = consensusTimestamp.split('.');
  const seconds = Number(secondsPart);
  const nanos = Number(`0.${nanosPart}`);
  if (Number.isNaN(seconds) || Number.isNaN(nanos)) {
    return undefined;
  }
  const millis = seconds * 1_000 + Math.floor(nanos * 1_000);
  return new Date(millis).toISOString();
};

export interface PollResult {
  checked: number;
  updated: number;
  failures: number;
  details: {
    id: string;
    status: string;
    transactionId?: string;
    message?: string;
    error?: string;
  }[];
}

const hasMirrorTransactionId = (operation: DltOperation): boolean => {
  return Boolean(operation.transactionId || operation.details?.transactionId);
};

export const pollShopTokenConfirmations = async (): Promise<PollResult> => {
  const repo = getDltOperationRepository();
  const result: PollResult = {
    checked: 0,
    updated: 0,
    failures: 0,
    details: [],
  };

  const candidates = await repo.findByStatus('PENDING_CONFIRMATION');
  const additional = await repo.findByStatus('PENDING_SIGNATURE');
  const seen = new Map<string, DltOperation>();

  [...candidates, ...additional].forEach((op) => {
    if (!POLLABLE_TYPES.includes(op.type)) return;
    if (!POLLABLE_STATUSES.includes(op.status)) return;
    if (!hasMirrorTransactionId(op)) return;
    if (!seen.has(op.id)) {
      seen.set(op.id, op);
    }
  });

  for (const operation of seen.values()) {
    result.checked += 1;
    const txnId = operation.transactionId || operation.details?.transactionId;
    if (!txnId) {
      continue;
    }

    const mirrorStatus = await fetchMirrorTransaction(txnId);

    if (mirrorStatus.status === 'PENDING') {
      result.details.push({
        id: operation.id,
        status: operation.status,
        transactionId: mirrorStatus.transactionId,
        message: 'Still pending confirmation on mirror node',
      });
      continue;
    }

    const isSuccess = mirrorStatus.status === 'SUCCESS';
    const updatedDetails = {
      ...(operation.details ?? {}),
      transactionId: mirrorStatus.transactionId,
      message:
        mirrorStatus.memo ||
        mirrorStatus.err ||
        (isSuccess ? 'Token transfer confirmed' : 'Token transfer failed'),
      mirrorStatus: mirrorStatus.rawStatus,
      mirrorRaw: mirrorStatus.raw,
    };

    const updatePayload: Partial<DltOperation> = {
      status: isSuccess ? 'SUCCESS' : 'ERROR',
      transactionId: mirrorStatus.transactionId,
      details: updatedDetails,
      completedAt:
        timestampToIsoString(mirrorStatus.consensusTimestamp) ||
        new Date().toISOString(),
    };

    try {
      await repo.update(operation.id, updatePayload);
      result.updated += 1;
      result.details.push({
        id: operation.id,
        status: updatePayload.status!,
        transactionId: mirrorStatus.transactionId,
        message: updatedDetails.message,
      });
    } catch (error: any) {
      result.failures += 1;
      result.details.push({
        id: operation.id,
        status: operation.status,
        transactionId: mirrorStatus.transactionId,
        error: error?.message || 'Failed to update operation',
      });
    }
  }

  return result;
};
