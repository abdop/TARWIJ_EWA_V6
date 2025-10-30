import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Transaction } from '@hashgraph/sdk';

import { RootState } from '../../src/store';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

interface OperationLogEntry {
  id: string;
  status: 'PENDING_SIGNATURE' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'ERROR' | string;
  createdAt: string;
  completedAt: string | null;
  tokenId: string | null;
  transactionId: string | null;
  type?: string;
  details: {
    employeeAccountId: string | null;
    shopAccountId: string | null;
    amount: number | null;
    memo: string | null;
    decimals: number | null;
    message: string | null;
  };
}

interface EcosystemToken {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  type: 'enterprise' | 'platform';
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  isAssociated?: boolean;
}

export default function ShopAdminDashboard() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const [employeeAccount, setEmployeeAccount] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [operations, setOperations] = useState<OperationLogEntry[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsError, setOperationsError] = useState<string | null>(null);

  const [catalogTokens, setCatalogTokens] = useState<EcosystemToken[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSuccess, setCatalogSuccess] = useState<string | null>(null);
  const [associationLoading, setAssociationLoading] = useState<string | null>(null);
  const [autoAssociating, setAutoAssociating] = useState(false);

  useEffect(() => {
    if (isConnected === false) {
      router.push('/');
      return;
    }

    if (isConnected && user && user.category !== 'shop_admin' && user.category !== 'cashier') {
      router.push('/');
    }
  }, [isConnected, router, user]);

  const amountInTinyUnits = useMemo(() => {
    if (!amountInput) return null;
    const parsed = Number(amountInput);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    // Default to 2 decimals (standard for most tokens)
    const multiplier = Math.pow(10, 2);
    return Math.round(parsed * multiplier);
  }, [amountInput]);

  const decodeTransactionBytes = useCallback((base64: string) => {
    if (typeof window !== 'undefined' && window.atob) {
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    const buffer = Buffer.from(base64, 'base64');
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }, []);

  const loadTokenCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const query = accountId ? `?shopAccountId=${encodeURIComponent(accountId)}` : '';
      const response = await fetch(`/api/shop/tokens${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load token catalog');
      }

      setCatalogTokens(Array.isArray(data.tokens) ? data.tokens : []);
    } catch (error: any) {
      console.error('Failed to load token catalog:', error);
      setCatalogError(error.message || 'Failed to load token catalog');
    } finally {
      setCatalogLoading(false);
    }
  }, [accountId]);

  const pendingAssociationTokenIds = useMemo(() => {
    const pending = new Set<string>();
    operations.forEach((op) => {
      if (!op) return;
      if (!op.type?.startsWith('SHOP_TOKEN_ASSOCIATE')) return;
      const tokenId = op.tokenId || (op.details as any)?.tokenId || null;
      if (!tokenId) return;
      const statusUpper = op.status?.toUpperCase?.();
      if (statusUpper === 'PENDING_SIGNATURE' || statusUpper === 'PENDING' || statusUpper === 'PENDING_CONFIRMATION') {
        pending.add(tokenId);
      }
    });
    return pending;
  }, [operations]);

  const loadOperations = useCallback(async () => {
    if (!accountId) return;
    setOperationsLoading(true);
    setOperationsError(null);
    try {
      const response = await fetch(`/api/shop/accept-token?shopAccountId=${encodeURIComponent(accountId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch operations');
      }

      setOperations(Array.isArray(data.operations) ? data.operations : []);
    } catch (error: any) {
      console.error('Failed to load operations:', error);
      setOperationsError(error.message || 'Failed to load operations');
    } finally {
      setOperationsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      loadOperations();
    }
  }, [accountId, loadOperations]);

  useEffect(() => {
    loadTokenCatalog();
  }, [loadTokenCatalog]);

  const handleAssociate = useCallback(
    async (token: EcosystemToken, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!accountId) {
        if (!silent) {
          setCatalogError('Connect your wallet before associating tokens.');
        }
        return false;
      }

      if (pendingAssociationTokenIds.has(token.tokenId)) {
        if (!silent) {
          setCatalogSuccess(`${token.symbol} association is already pending confirmation.`);
        }
        return true;
      }

      setAssociationLoading(token.tokenId);
      if (!silent) {
        setCatalogError(null);
        setCatalogSuccess(null);
      } else {
        setCatalogError(null);
      }

      let succeeded = false;

      try {
        const response = await fetch('/api/shop/associate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopAccountId: accountId,
            tokenId: token.tokenId,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          const errorMessage = data.error || 'Failed to prepare token association';
          if (errorMessage.includes('already associated')) {
            if (!silent) {
              setCatalogSuccess(`${token.symbol} is already associated.`);
            }
            setAssociationLoading(null);
            if (!silent) {
              await loadTokenCatalog();
              await loadOperations();
            }
            return true;
          }
          throw new Error(errorMessage);
        }

        const { transactionBytes, operationId } = data;
        if (!transactionBytes) {
          throw new Error('Transaction bytes missing from response');
        }

        const bytes = decodeTransactionBytes(transactionBytes);
        const transaction = Transaction.fromBytes(bytes);

        const { executeTransaction } = await import('../../src/services/hashconnect');
        const associationResult = await executeTransaction(accountId, transaction);
        console.log('Association result:', associationResult);
        const transactionId = (associationResult as any)?.transactionId?.toString?.();

        if (!transactionId) {
          console.error('No transaction ID in result:', associationResult);
          throw new Error('Wallet signature cancelled or no transaction ID returned. Please approve the request in your wallet.');
        }

        console.log('Association transaction ID:', transactionId);

        if (operationId) {
          try {
            const patchResponse = await fetch('/api/shop/accept-token', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                operationId,
                transactionId,
                shopAccountId: accountId,
                status: 'PENDING_CONFIRMATION',
                message: `Association submitted for ${token.symbol}`,
              }),
            });

            if (!patchResponse.ok) {
              const patchData = await patchResponse.json();
              console.error('PATCH failed:', patchData);
            } else {
              console.log('Operation updated successfully');
            }
          } catch (patchError) {
            console.error('Failed to update association operation:', patchError);
          }
        }

        if (!silent) {
          setCatalogSuccess(`${token.symbol} association submitted. Pending confirmation.`);
        }
        succeeded = true;
      } catch (error: any) {
        console.error('Token association failed:', error);
        const errorMessage = error.message || 'Token association failed';
        if (errorMessage.includes('already associated')) {
          if (!silent) {
            setCatalogSuccess(`${token.symbol} is already associated.`);
          }
          succeeded = true;
        } else {
          setCatalogError(errorMessage);
          succeeded = false;
        }
      } finally {
        setAssociationLoading(null);
        if (!silent) {
          await loadTokenCatalog();
          await loadOperations();
        }
      }

      return succeeded;
    },
    [accountId, decodeTransactionBytes, loadOperations, loadTokenCatalog, pendingAssociationTokenIds]
  );

  useEffect(() => {
    if (!accountId || !isConnected) return;
    if (catalogLoading || associationLoading || autoAssociating) return;

    const unassociated = catalogTokens.filter(
      (token) => !token.isAssociated && !pendingAssociationTokenIds.has(token.tokenId)
    );
    if (unassociated.length === 0) {
      return;
    }

    let cancelled = false;

    const associateAll = async () => {
      setAutoAssociating(true);
      setCatalogSuccess('Associating required tokens with your shop wallet…');
      let successfulAssociations = 0;

      try {
        for (const token of unassociated) {
          if (cancelled) break;
          const success = await handleAssociate(token, { silent: true });
          if (success) {
            successfulAssociations += 1;
          } else {
            break;
          }
        }

        if (!cancelled) {
          if (successfulAssociations === unassociated.length) {
            setCatalogSuccess('All required tokens submitted for association. Confirmations may take a moment.');
          } else {
            setCatalogSuccess(null);
          }
        }
      await loadTokenCatalog();
      await loadOperations();
      } finally {
        if (!cancelled) {
          setAutoAssociating(false);
        }
      }
    };

    associateAll();

    return () => {
      cancelled = true;
    };
  }, [accountId, isConnected, catalogLoading, associationLoading, catalogTokens, autoAssociating, handleAssociate]);

  return (
    <>
      <Head>
        <title>Shop Admin • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-64 min-h-screen bg-background-light/10 border-r border-gray-700">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-white mb-8">Shop Admin</h1>
              <nav className="space-y-2">
                <button
                  onClick={() => router.push('/shop-admin')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-white bg-primary rounded-lg"
                >
                  <DashboardIcon className="h-5 w-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/shop-admin/sales')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-background-light/20 rounded-lg transition"
                >
                  <ShopIcon className="h-5 w-5" />
                  Sales
                </button>
                <button
                  onClick={() => router.push('/shop-admin/swap')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-background-light/20 rounded-lg transition"
                >
                  <SwapIcon className="h-5 w-5" />
                  Token Swap
                </button>
              </nav>
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Shop Dashboard</h2>
                  <p className="text-gray-400 mt-2">Accept tokens directly from employee wallets</p>
                </div>
                <HashConnectButton />
              </div>
            </div>

            <div className="flex-1 p-10">
              <div className="max-w-6xl mx-auto space-y-8">
                {user && (
                  <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Welcome, {user.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Account ID</span>
                        <p className="text-white font-mono text-sm break-all">{accountId}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Role</span>
                        <p className="text-primary font-semibold capitalize">{user.category?.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Shop</span>
                        {/*TODO: Add enterprise shop ID */}
                        <p className="text-white font-semibold">{'—'}</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Token Balances */}
                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
                  <p className="text-sm text-gray-400 mb-6">Total tokens received from customer payments</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catalogTokens
                      .filter((token) => token.isAssociated)
                      .map((token) => {
                        const successfulPayments = operations.filter(
                          (op) =>
                            op.type === 'SHOP_ACCEPT_TOKEN_PREPARED' &&
                            op.status === 'SUCCESS' &&
                            (op.tokenId === token.tokenId || (op.details as any)?.tokenId === token.tokenId)
                        );
                        
                        const totalReceived = successfulPayments.reduce(
                          (sum, op) => sum + (op.details.amount || 0),
                          0
                        );
                        
                        const divisor = Math.pow(10, token.decimals);
                        const formattedBalance = (totalReceived / divisor).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                        
                        return (
                          <div
                            key={token.tokenId}
                            className="bg-background-dark/60 border border-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-400">{token.name}</p>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                                token.type === 'platform'
                                  ? 'bg-primary/20 text-primary border border-primary/40'
                                  : 'bg-green-500/20 text-green-300 border border-green-500/40'
                              }`}>
                                {token.type === 'platform' ? 'Platform' : 'Enterprise'}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formattedBalance} {token.symbol}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {successfulPayments.length} transaction{successfulPayments.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        );
                      })}
                    
                    {catalogTokens.filter((t) => t.isAssociated).length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <p className="text-sm text-gray-500">No associated tokens yet. Associate tokens below to start accepting payments.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6 space-y-4">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Token Catalog</h3>
                      <p className="text-sm text-gray-400">Associate any enterprise token or the platform stablecoin with the shop wallet.</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadTokenCatalog}
                      disabled={catalogLoading}
                      className="text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </header>

                  {catalogSuccess && (
                    <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                      {catalogSuccess}
                    </div>
                  )}

                  {catalogError && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {catalogError}
                    </div>
                  )}

                  {catalogLoading ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-700/60 bg-background-dark/60 p-4 text-sm text-gray-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading catalog…
                    </div>
                  ) : catalogTokens.length === 0 ? (
                    <p className="text-sm text-gray-500">No tokens available yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catalogTokens.map((token) => {
                        const isAssociated = token.isAssociated;
                        const isDisabled =
                          isAssociated ||
                          associationLoading === token.tokenId ||
                          pendingAssociationTokenIds.has(token.tokenId) ||
                          !isConnected ||
                          autoAssociating;
                        return (
                          <div
                            key={token.tokenId}
                            className="rounded-lg border border-gray-700/70 bg-background-dark/60 p-4 text-sm text-gray-300 flex flex-col gap-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-lg font-semibold text-white">{token.symbol}</p>
                                <p className="text-xs text-gray-500">{token.name}</p>
                              </div>
                              <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-primary/20 text-primary border border-primary/40">
                                {token.type === 'platform' ? 'Platform' : 'Enterprise'}
                              </span>
                            </div>
                            {token.enterpriseName && token.type === 'enterprise' && (
                              <p className="text-xs text-gray-500">Enterprise: {token.enterpriseName}</p>
                            )}
                            <div className="mt-auto flex items-center justify-between gap-3">
                              <div className="text-xs text-gray-500">
                                Decimals: {token.decimals}
                              </div>
                              {isAssociated ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                                  Associated
                                </span>
                              ) : pendingAssociationTokenIds.has(token.tokenId) ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                                  Pending Confirmation
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAssociate(token)}
                                  disabled={isDisabled}
                                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-background-dark transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {associationLoading === token.tokenId ? (
                                    <>
                                      <span className="h-3 w-3 animate-spin rounded-full border border-background-dark border-t-transparent" />
                                      Associating…
                                    </>
                                  ) : (
                                    'Associate Token'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Recent Token Operations</h3>
                    <button
                      type="button"
                      onClick={loadOperations}
                      disabled={operationsLoading}
                      className="text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>
                  {operationsError && (
                    <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {operationsError}
                    </div>
                  )}
                  {operationsLoading && operations.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-700/60 bg-background-dark/60 p-4 text-sm text-gray-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading operations…
                    </div>
                  ) : operations.length === 0 ? (
                    <p className="text-sm text-gray-500">No operations yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {operations.map((entry) => {
                        const isAssociation = entry.type?.startsWith('SHOP_TOKEN_ASSOCIATE');
                        const decimals = entry.details.decimals ?? 2;
                        const divisor = Math.pow(10, decimals);
                        const rawAmount = entry.details.amount ?? 0;
                        const formattedAmount = (rawAmount / divisor).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                        const employeeId = entry.details.employeeAccountId ?? '—';
                        const tokenIdFromEntry = entry.tokenId || (entry.details as any)?.tokenId;
                        const catalogToken = catalogTokens.find((t) => t.tokenId === tokenIdFromEntry);
                        const tokenSymbol = catalogToken?.symbol || 'TOKEN';

                        let statusStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                        if (entry.status?.toUpperCase().includes('SUCCESS')) {
                          statusStyle = 'bg-green-500/20 text-green-300 border border-green-500/40';
                        } else if (entry.status?.toUpperCase().includes('FAIL') || entry.status?.toUpperCase().includes('ERROR')) {
                          statusStyle = 'bg-red-500/20 text-red-300 border border-red-500/40';
                        }

                        return (
                          <li
                            key={entry.id}
                            className="rounded-lg border border-gray-700/70 bg-background-dark/60 p-4 text-sm text-gray-300"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-white">
                                    {isAssociation ? `Token Association: ${tokenSymbol}` : `${tokenSymbol} • ${formattedAmount}`}
                                  </p>
                                  {catalogToken && (
                                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide bg-primary/20 text-primary border border-primary/40">
                                      {catalogToken.type === 'platform' ? 'Platform' : 'Enterprise'}
                                    </span>
                                  )}
                                </div>
                                {!isAssociation && (
                                  <p className="text-xs text-gray-500">Employee: {employeeId}</p>
                                )}
                                {isAssociation && catalogToken?.enterpriseName && (
                                  <p className="text-xs text-gray-500">Enterprise: {catalogToken.enterpriseName}</p>
                                )}
                                <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                  {entry.status.toLowerCase().replace(/_/g, ' ')}
                                </span>
                                {entry.transactionId && (
                                  <p className="mt-1 text-xs text-primary break-all">
                                    {entry.transactionId}
                                  </p>
                                )}
                                {entry.details.message && (
                                  <p className="mt-1 text-xs text-gray-400">{entry.details.message}</p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" /></svg>;
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>;
}

function ShopIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" /></svg>;
}

function SwapIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
