import { useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../../src/store';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import useEnterpriseOverview from '../../src/hooks/useEnterpriseOverview';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  treasuryBalance: number;
  fractionalFee: number;
  status: 'active' | 'paused';
}

interface Transaction {
  id: string;
  type: 'mint' | 'transfer' | 'burn';
  amount: number;
  from?: string;
  to?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function TokensPage() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);
  const enterpriseId = user?.entrepriseId;

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useEnterpriseOverview(enterpriseId, {
    enabled: Boolean(enterpriseId),
    refreshIntervalMs: 60000,
  });

  useEffect(() => {
    if (isConnected === false) {
      router.push('/');
    }
  }, [isConnected, router]);

  const tokenInfo = overview?.token ?? null;

  const tokenTransactions = useMemo(() => {
    if (!overview?.transactions) return [];
    return overview.transactions
      .filter((tx) => tx.type !== 'request')
      .map((tx) => ({
        ...tx,
        typeLabel: tx.type.replace(/_/g, ' '),
        timestampLabel: tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '—',
      }));
  }, [overview]);

  const formatNumber = (value?: number, fallback = '—') =>
    typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : fallback;

  const formatAmount = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toLocaleString()} WAT` : '—';

  return (
    <>
      <Head>
        <title>Token Management • TARWIJ EWA</title>
      </Head>

      <div className="bg-gradient-to-br from-background-dark via-background-dark to-background-dark/95 min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-72 bg-background-dark/90 backdrop-blur-sm p-6 flex flex-col border-r border-gray-800/50 shadow-2xl">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1 pl-12">Enterprise Admin</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/ent-admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-primary/10 hover:text-primary transition-all">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/ent-admin/employees" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-primary/10 hover:text-primary transition-all">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
              </a>
              <a href="/ent-admin/tokens" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/30 to-primary/20 text-primary font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                <TokenIcon className="w-5 h-5" />
                <span>Token Management</span>
              </a>
            </nav>
            <div className="mt-auto pt-8">
              <div className="px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-400">Connected</span>
                </div>
                <p className="text-xs text-gray-500">via HashPack</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="border-b border-gray-800/50 bg-gradient-to-r from-background-dark/80 via-background-dark/60 to-background-dark/80 backdrop-blur-md px-10 py-5 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Token Management</h1>
                  <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Manage your enterprise tokens and operations
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {isConnected && user && (
                    <div className="text-right px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <p className="text-xs text-gray-400">Connected as</p>
                      <p className="text-white font-semibold">{user.name}</p>
                    </div>
                  )}
                  <HashConnectButton />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-10">
              <div className="max-w-7xl mx-auto space-y-8">
                {overviewLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {/* Token Info Card */}
                    {tokenInfo ? (
                      <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-primary/10 via-background-light/10 to-background-light/5 p-8 shadow-xl">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                              <TokenIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-white">{tokenInfo.name}</h2>
                              <p className="text-gray-400 mt-1">Symbol: <span className="text-primary font-semibold">{tokenInfo.symbol}</span></p>
                              <p className="text-gray-500 text-xs mt-1">Token ID: <span className="font-mono text-white">{tokenInfo.tokenId}</span></p>
                            </div>
                          </div>
                          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500/20 text-green-500">
                            Active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl bg-background-dark/40 border border-gray-700/30">
                            <p className="text-xs text-gray-400 mb-1">Total Supply</p>
                            <p className="text-white font-bold text-lg">{formatNumber(tokenInfo.totalSupply)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-background-dark/40 border border-gray-700/30">
                            <p className="text-xs text-gray-400 mb-1">Decimals</p>
                            <p className="text-white font-bold text-lg">{tokenInfo.decimals}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-background-dark/40 border border-gray-700/30">
                            <p className="text-xs text-gray-400 mb-1">Treasury Balance</p>
                            <p className="text-primary font-bold text-lg">{formatAmount(tokenInfo.treasuryBalance)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-background-dark/40 border border-gray-700/30">
                            <p className="text-xs text-gray-400 mb-1">Fractional Fee</p>
                            <p className="text-white font-bold text-lg">{formatNumber(tokenInfo.fractionalFee * 100)}%</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
                        No enterprise token configured yet.
                      </div>
                    )}

                    {overviewError && (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 flex items-center justify-between">
                        <span>{overviewError}</span>
                        <button
                          className="px-3 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 transition-colors"
                          onClick={refreshOverview}
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Token administration notice */}
                    <div className="rounded-2xl border border-gray-700/50 bg-background-dark/60 p-6">
                      <h3 className="text-lg font-semibold text-white">Token administration is handled by TARWIJ EWA</h3>
                      <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                        Enterprise admins have read-only visibility of token balances and recent activity. Minting, pausing, and other
                        configuration changes are coordinated by the TARWIJ EWA platform team. Please contact your platform administrator
                        if you need to request an update.
                      </p>
                    </div>

                    {/* Transaction History */}
                    <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-background-light/10 to-background-light/5 p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
                        <div>
                          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <HistoryIcon className="w-5 h-5 text-primary" />
                            Transaction History
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">Recent token operations and transfers</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-all">
                          View All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {tokenTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-4 rounded-xl bg-background-dark/40 border border-gray-700/30 hover:border-primary/30 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    tx.type === 'mint'
                                      ? 'bg-green-500/20'
                                      : tx.type === 'transfer'
                                      ? 'bg-blue-500/20'
                                      : 'bg-red-500/20'
                                  }`}
                                >
                                  {tx.type === 'mint' && <PlusIcon className="w-5 h-5 text-green-500" />}
                                  {tx.type === 'transfer' && <TransferIcon className="w-5 h-5 text-blue-400" />}
                                  {tx.type === 'burn' && <FireIcon className="w-5 h-5 text-red-500" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-semibold capitalize">{tx.typeLabel}</p>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        tx.status === 'completed'
                                          ? 'bg-green-500/20 text-green-500'
                                          : tx.status === 'pending'
                                          ? 'bg-amber-500/20 text-amber-500'
                                          : 'bg-red-500/20 text-red-500'
                                      }`}
                                    >
                                      {tx.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    {tx.from && <span>From: {tx.from}</span>}
                                    {tx.from && tx.to && <span>→</span>}
                                    {tx.to && <span>To: {tx.to}</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{formatAmount(tx.amount ?? undefined)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// Icons
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" /></svg>;
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>;
}

function TokenIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-1H9v-2h2v-3H9V9h2V7h2v2h2v2h-2v3h2v2h-2Z" /></svg>;
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>;
}

function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function TransferIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}

function FireIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 23a7.5 7.5 0 0 1-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47.27.773.5 1.604.5 2.47A7.5 7.5 0 0 1 12 23Z"/></svg>;
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}