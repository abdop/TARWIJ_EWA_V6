const DEFAULT_MIRROR_URL = process.env.HEDERA_MIRROR_NODE_URL ||
  'https://testnet.mirrornode.hedera.com';

export interface MirrorTransactionStatus {
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  transactionId: string;
  consensusTimestamp?: string;
  rawStatus?: string;
  memo?: string;
  err?: string;
  raw?: unknown;
}

const padNanoseconds = (value: string) => value.padEnd(9, '0').slice(0, 9);

export const normalizeTransactionIdForMirror = (transactionId: string): string => {
  const [accountPart, timestampPart] = transactionId.split('@');
  if (!timestampPart) {
    // Already normalized or missing timestamp separator
    const parts = transactionId.split('-');
    if (parts.length === 3) {
      return transactionId;
    }
    return transactionId.replace(/_/g, '-');
  }

  const [seconds, nanosRaw = '0'] = timestampPart.split('.');
  const nanoseconds = padNanoseconds(nanosRaw);

  return `${accountPart}-${seconds}-${nanoseconds}`;
};

export const fetchMirrorTransaction = async (
  transactionId: string,
  mirrorUrl: string = DEFAULT_MIRROR_URL
): Promise<MirrorTransactionStatus> => {
  const normalizedId = normalizeTransactionIdForMirror(transactionId);
  const endpoint = `${mirrorUrl}/api/v1/transactions/${normalizedId}`;

  try {
    const response = await fetch(endpoint);

    if (response.status === 404) {
      return {
        status: 'PENDING',
        transactionId: normalizedId,
        rawStatus: 'NOT_FOUND',
        raw: null,
      };
    }

    if (!response.ok) {
      return {
        status: 'ERROR',
        transactionId: normalizedId,
        rawStatus: 'HTTP_ERROR',
        err: `Mirror node responded with ${response.status}`,
      };
    }

    const payload = await response.json();
    const transaction = Array.isArray(payload.transactions)
      ? payload.transactions[0]
      : undefined;

    if (!transaction) {
      return {
        status: 'PENDING',
        transactionId: normalizedId,
        rawStatus: 'EMPTY',
        raw: payload,
      };
    }

    const status = transaction.result || transaction.status;
    const success = status?.toUpperCase?.() === 'SUCCESS';

    return {
      status: success ? 'SUCCESS' : 'ERROR',
      transactionId: normalizedId,
      rawStatus: status,
      consensusTimestamp: transaction.consensus_timestamp,
      memo: transaction.memo,
      err: success ? undefined : transaction?.error_message || transaction?.name,
      raw: transaction,
    };
  } catch (error: any) {
    return {
      status: 'ERROR',
      transactionId: normalizeTransactionIdForMirror(transactionId),
      rawStatus: 'FETCH_ERROR',
      err: error?.message || 'Unknown mirror fetch error',
    };
  }
};
