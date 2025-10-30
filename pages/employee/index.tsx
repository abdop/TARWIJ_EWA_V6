import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../../src/store';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEmployeeOverview } from '../../src/hooks/useEnterpriseOverview';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

const WageAdvanceRequest = dynamic(
  () => import('../../src/components/WageAdvanceRequest'),
  { ssr: false }
);

const statusColorMap: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  pending_signature: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  approved: 'bg-green-500/20 text-green-300 border border-green-500/40',
  completed: 'bg-green-500/20 text-green-300 border border-green-500/40',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  useEffect(() => {
    if (isConnected === false) {
      router.push('/');
    }
  }, [isConnected, router]);

  const {
    data: overview,
    loading,
    error,
    refresh,
  } = useEmployeeOverview(accountId, {
    enabled: Boolean(isConnected && accountId),
    refreshIntervalMs: 60000,
  });

  const decimals = overview?.token?.decimals ?? 2;
  const amountDivisor = useMemo(() => Math.pow(10, decimals || 0), [decimals]);

  const formatAmount = (value?: number | null) => {
    if (value === undefined || value === null) return '—';
    return (value / amountDivisor).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const availableBalance = overview
    ? Math.max(overview.stats.lifetimeAdvanced - overview.stats.pendingAmount, 0)
    : null;

  const lifetimeAdvanced = overview?.stats.lifetimeAdvanced ?? null;
  const pendingAmount = overview?.stats.pendingAmount ?? null;
  const pendingRequestsCount = overview?.stats.pendingCount ?? null;

  const latestRequests = useMemo(
    () => overview?.requests.slice(0, 5) ?? [],
    [overview?.requests]
  );

  const renderStatusChip = (status: string) => {
    const normalized = status.toLowerCase();
    const classes = statusColorMap[normalized] ?? 'bg-gray-700/40 text-gray-200 border border-gray-600/60';
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${classes}`}>
        {normalized.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Employee • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/employee" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/employee/request" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <RequestIcon className="w-5 h-5" />
                <span>Request Advance</span>
              </a>
              <a href="/employee/wallet" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <WalletIcon className="w-5 h-5" />
                <span>My Wallet</span>
              </a>
              <a href="/employee/pay-shop" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <PayIcon className="w-5 h-5" />
                <span>Pay Shop</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">Connected via HashPack</div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
                  <p className="text-gray-400 mt-1 text-sm">Request wage advances and manage your tokens</p>
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
              <div className="max-w-6xl mx-auto space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                    <p className="text-sm text-gray-400">Available Balance</p>
                    <p className="text-4xl font-bold text-white mt-3">
                      {formatAmount(availableBalance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {overview?.token?.symbol ?? 'Tokens'}
                    </p>
                  </div>
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                    <p className="text-sm text-gray-400">Pending Requests</p>
                    <p className="text-4xl font-bold text-white mt-3">
                      {pendingRequestsCount ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
                  </div>
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                    <p className="text-sm text-gray-400">Lifetime Advanced</p>
                    <p className="text-4xl font-bold text-white mt-3">
                      {formatAmount(lifetimeAdvanced)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Total received</p>
                  </div>
                </section>

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

                {!isConnected ? (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">
                      Please connect your HashPack wallet to request wage advances.
                    </p>
                    <HashConnectButton />
                  </div>
                ) : (
                  <>
                    {loading && (
                      <div className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-background-light/5 p-4 text-sm text-gray-400">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading your latest activity…
                      </div>
                    )}

                    {!loading && (
                      <section className="rounded-xl border border-gray-700 bg-background-light/5 p-6 space-y-4">
                        <header className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-white">Recent Requests</h2>
                            <p className="text-sm text-gray-400">
                              Track the latest status updates on your wage advances
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={refresh}
                            className="text-sm font-semibold text-primary hover:text-primary/80"
                          >
                            Refresh
                          </button>
                        </header>
                        {latestRequests.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-sm text-gray-400 text-center">
                            No requests yet. Submit your first wage advance to see it here.
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {latestRequests.map((request) => (
                              <li
                                key={request.id}
                                className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-700/60 bg-background-dark/60 p-4"
                              >
                                <div className="flex-1 min-w-[180px]">
                                  <p className="text-sm font-semibold text-white">{request.id}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(request.updatedAt || request.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="text-sm font-semibold text-white">
                                    {formatAmount(request.requestedAmount)} {overview?.token?.symbol ?? 'WAT'}
                                  </p>
                                  {renderStatusChip(request.status)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )}

                    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                      <WageAdvanceRequest onSuccess={refresh} />
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

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" /></svg>;
}

function RequestIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>;
}

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>;
}

function PayIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>;
}
