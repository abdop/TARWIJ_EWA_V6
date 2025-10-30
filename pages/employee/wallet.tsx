import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useEmployeeOverview, EmployeeOverviewSummary } from '../../src/hooks/useEnterpriseOverview';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

const statusClasses: Record<string, string> = {
  success: 'bg-green-500/20 text-green-300 border border-green-500/40',
  completed: 'bg-green-500/20 text-green-300 border border-green-500/40',
  approved: 'bg-green-500/20 text-green-300 border border-green-500/40',
  pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  pending_signature: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  scheduled: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/40',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

export default function EmployeeWalletPage() {
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const {
    data: overview,
    loading,
    error,
    refresh,
  } = useEmployeeOverview(accountId ?? undefined, {
    enabled: Boolean(isConnected && accountId),
    refreshIntervalMs: 60_000,
  });

  const walletTips = useMemo(
    () => [
      {
        title: 'Keep your wallet linked',
        description: 'Stay signed in with HashPack so you can receive tokens instantly after approvals.',
      },
      {
        title: 'Secure your keys',
        description: 'Never share your private keys. TARWIJ EWA will only request signatures inside your wallet app.',
      },
      {
        title: 'Monitor gas fees',
        description: 'Transaction fees are deducted from the treasury. We will surface any fee-related issues here.',
      },
    ],
    []
  );

  const decimals = overview?.token?.decimals ?? 2;
  const amountDivisor = useMemo(() => Math.pow(10, decimals || 0), [decimals]);
  const tokenSymbol = overview?.token?.symbol ?? 'WAT';
  const recentActivity: EmployeeOverviewSummary['recentActivity'] = overview?.recentActivity ?? [];

  const formatAmount = (value?: number | null) => {
    if (value === undefined || value === null) {
      return '—';
    }
    return (value / amountDivisor).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    const normalized = status.toLowerCase();
    return statusClasses[normalized] ?? 'bg-gray-600/30 text-gray-300 border border-gray-500/40';
  };

  const extractAmountFromDetails = (details: Record<string, unknown>) => {
    const amountCandidate = details.requestedAmount ?? details.amount;
    return typeof amountCandidate === 'number' ? amountCandidate : null;
  };

  const extractNameFromDetails = (details: Record<string, unknown>) => {
    const nameCandidate = details.employeeName ?? details.name;
    return typeof nameCandidate === 'string' ? nameCandidate : null;
  };

  const currentBalance = overview?.stats.currentBalance ?? null;
  const totalSpent = overview?.stats.totalShopPayments ?? null;

  const tokenCards = useMemo(
    () => [
      {
        label: 'Total Received',
        value: formatAmount(overview?.stats.lifetimeAdvanced ?? null),
        helper: 'Approved wage advances delivered to your wallet',
      },
      {
        label: 'Current Balance',
        value: formatAmount(currentBalance),
        helper: 'Available balance after shop payments',
      },
      {
        label: 'Total Spent',
        value: formatAmount(totalSpent),
        helper: 'Total amount spent at partner shops',
      },
    ],
    [currentBalance, totalSpent, overview, formatAmount]
  );

  return (
    <>
      <Head>
        <title>My Wallet • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/employee" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/employee/request" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <RequestIcon className="w-5 h-5" />
                <span>Request Advance</span>
              </a>
              <a href="/employee/wallet" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <WalletIcon className="w-5 h-5" />
                <span>My Wallet</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">Connected via HashPack</div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">My Wallet</h1>
                  <p className="text-gray-400 mt-1 text-sm">Review your account details, token balances, and recent activity.</p>
                </div>
                <div className="flex items-center gap-4">
                  {isConnected && user && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Connected as</p>
                      <p className="text-white font-semibold">{user.name}</p>
                    </div>
                  )}
                  <HashConnectButton />
                </div>
              </div>
            </div>

            <div className="flex-1 p-10">
              <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-6">
                  {error && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 flex items-center justify-between">
                      <span>{error}</span>
                      <button
                        type="button"
                        onClick={refresh}
                        className="rounded-md border border-red-500/40 px-3 py-1 text-red-100 hover:bg-red-500/20"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <section className="rounded-2xl border border-gray-700 bg-background-light/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Account Overview</h2>

                    {!isConnected ? (
                      <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-center text-sm text-gray-400">
                        Connect your wallet to view balances and token holdings.
                        <div className="mt-4 flex justify-center">
                          <HashConnectButton />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-background-dark/50 border border-gray-700 p-5">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Wallet Account ID</p>
                          <p className="mt-2 font-mono text-white text-sm break-all">{accountId ?? '—'}</p>
                        </div>
                        <div className="rounded-xl bg-background-dark/50 border border-gray-700 p-5">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Linked Enterprise</p>
                          <p className="mt-2 text-white text-sm">{user?.entrepriseId ?? '—'}</p>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-gray-700 bg-background-light/5 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Token Balances</h2>
                      <button
                        type="button"
                        onClick={refresh}
                        disabled={!isConnected || loading}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Refresh
                      </button>
                    </div>

                    {!isConnected ? (
                      <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-sm text-gray-400">
                        Connect your wallet to view token balances.
                      </div>
                    ) : loading && !overview ? (
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading token balances…
                      </div>
                    ) : overview ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {tokenCards.map((card) => (
                            <div key={card.label} className="rounded-xl bg-background-dark/50 border border-gray-700/80 p-5">
                              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{card.label}</p>
                              <p className="text-2xl font-bold text-white mt-3">{card.value} {tokenSymbol}</p>
                              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{card.helper}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                          <div className="rounded-lg border border-gray-700/60 bg-background-dark/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Token ID</p>
                            <p className="mt-2 font-mono text-white text-sm break-all">{overview.token?.tokenId ?? '—'}</p>
                          </div>
                          <div className="rounded-lg border border-gray-700/60 bg-background-dark/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Treasury Account</p>
                            <p className="mt-2 font-mono text-white text-sm break-all">{overview.token?.treasuryAccountId ?? '—'}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-sm text-gray-400">
                        We could not load token balance information.
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-gray-700 bg-background-light/5 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                      <button
                        type="button"
                        onClick={refresh}
                        disabled={!isConnected || loading}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Refresh
                      </button>
                    </div>

                    {!isConnected ? (
                      <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-sm text-gray-400">
                        Connect your wallet to view your recent wage advance activity.
                      </div>
                    ) : loading && !recentActivity.length ? (
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading recent activity…
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-sm text-gray-400">
                        No recent activity recorded yet. Your wage advances and token transactions will appear here.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {recentActivity.map((activity) => {
                          const details = activity.details ?? {};
                          const extractedAmount = extractAmountFromDetails(details);
                          const extractedName = extractNameFromDetails(details);

                          return (
                            <li
                              key={activity.id}
                              className="rounded-lg border border-gray-700/70 bg-background-dark/60 p-4 flex flex-col gap-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {activity.type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-gray-500">{formatDateTime(activity.createdAt)}</p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(
                                    activity.status
                                  )}`}
                                >
                                  {activity.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                                {extractedName && <span>{extractedName}</span>}
                                {extractedAmount !== null && (
                                  <span className="text-white/90">
                                    {formatAmount(extractedAmount)} {tokenSymbol}
                                  </span>
                                )}
                                {activity.transactionId && (
                                  <span className="font-mono text-gray-500">Tx: {activity.transactionId}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-xl border border-primary/30 bg-primary/10 p-6 shadow-lg shadow-primary/10">
                    <h2 className="text-lg font-semibold text-white mb-3">Wallet Tips</h2>
                    <ul className="space-y-4">
                      {walletTips.map((tip) => (
                        <li key={tip.title} className="bg-background-dark/50 border border-primary/20 rounded-lg p-4">
                          <p className="text-sm font-semibold text-primary">{tip.title}</p>
                          <p className="mt-1 text-sm text-gray-300 leading-relaxed">{tip.description}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-gray-700 bg-background-light/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-3">Token Associations</h2>
                    <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-5 text-sm text-gray-400">
                      We will display any pending token associations or required signatures here.
                    </div>
                  </section>
                </aside>
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

function RequestIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>;
}

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>;
}
