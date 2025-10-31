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

export default function EntAdminDashboard() {
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

  const stats = overview?.stats;
  const pendingRequests = useMemo(() => overview?.pendingRequests.slice(0, 3) ?? [], [overview]);
  const recentActivity = useMemo(() => overview?.recentActivity.slice(0, 6) ?? [], [overview]);

  const formatNumber = (value?: number, fallback = '—') =>
    typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : fallback;

  const formatTokenBalance = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value)
      ? `${value.toLocaleString()} WAT`
      : '—';

  // Redirect to home if not connected (only after initial load)
  useEffect(() => {
    if (isConnected === false) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <>
      <Head>
        <title>Enterprise Admin • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-gradient-to-br from-background-dark via-background-dark to-background-dark/95 min-h-screen text-gray-200">
        <div className="flex min-h-screen">
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
              <a href="/ent-admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/30 to-primary/20 text-primary font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/ent-admin/employees" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-primary/10 hover:text-primary transition-all">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
              </a>
              <a href="/ent-admin/tokens" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-primary/10 hover:text-primary transition-all">
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

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="border-b border-gray-800/50 bg-gradient-to-r from-background-dark/80 via-background-dark/60 to-background-dark/80 backdrop-blur-md px-10 py-5 shadow-lg">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Enterprise Dashboard</h1>
                  <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Manage your enterprise and employees
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

            {/* Main Content */}
            <div className="flex-1 p-10">
              <div className="max-w-6xl mx-auto space-y-8">

              {user && (
                <section className="bg-gradient-to-br from-primary/10 via-background-light/10 to-background-light/5 border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Welcome, {user.name}</h3>
                      <p className="text-sm text-primary font-medium">{user.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-background-dark/40 border border-gray-700/30">
                      <span className="text-gray-400 text-xs">Account ID</span>
                      <p className="text-white font-mono mt-1">{accountId}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background-dark/40 border border-gray-700/30">
                      <span className="text-gray-400 text-xs">Enterprise</span>
                      <p className="text-white mt-1">{user.entrepriseId}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <article className="group rounded-2xl border border-gray-700/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400 font-medium">Total Employees</p>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <UsersIcon className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <p className="mt-3 text-4xl font-bold text-white">{formatNumber(stats?.totalEmployees)}</p>
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Admins: {formatNumber(stats?.adminCount)} • Deciders: {formatNumber(stats?.deciderCount)}
                  </div>
                </article>
                <article className="group rounded-2xl border border-gray-700/50 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400 font-medium">Pending Requests</p>
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                      <ClockIcon className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                  <p className="mt-3 text-4xl font-bold text-white">{formatNumber(stats?.pendingRequests)}</p>
                  <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {formatNumber(stats?.pendingAmount)} WAT awaiting approval
                  </p>
                </article>
                <article className="group rounded-2xl border border-gray-700/50 bg-gradient-to-br from-primary/10 to-primary/5 p-6 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400 font-medium">Token Balance</p>
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <TokenIcon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="mt-3 text-4xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                    {formatTokenBalance(overview?.token?.treasuryBalance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Latest supply: {formatNumber(overview?.token?.totalSupply)} units</p>
                  <p className="mt-2 text-xs text-gray-500">Settlement day: {overview?.token?.settlementDay ?? '—'}</p>
                </article>
              </section>

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

              {overviewLoading && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-700/40 bg-background-dark/60 p-4 text-sm text-gray-400">
                  <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Loading enterprise data…
                </div>
              )}

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-background-light/10 to-background-light/5 p-6 space-y-4 shadow-xl hover:shadow-2xl transition-all">
                  <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-700/50">
                    <div>
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Pending Requests
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">Newest requests requiring approval</p>
                    </div>
                    <button
                      onClick={refreshOverview}
                      className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-all hover:gap-2"
                    >
                      Refresh
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </header>
                  <ul className="space-y-3">
                    {pendingRequests.length === 0 && !overviewLoading && (
                      <li className="rounded-lg border border-gray-700/40 bg-background-dark/40 p-4 text-sm text-gray-400 text-center">
                        No pending wage requests.
                      </li>
                    )}
                    {pendingRequests.map((request) => {
                      const employeeInitials = request.employeeName
                        .split(' ')
                        .map((n) => n[0])
                        .join('');
                      return (
                        <li
                          key={request.id}
                          className="group rounded-lg border border-gray-700/50 bg-background-dark/60 p-4 flex flex-col gap-3 hover:border-primary/50 hover:bg-background-dark/80 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                                {employeeInitials}
                              </div>
                              <div>
                                <p className="text-white font-semibold group-hover:text-primary transition-colors">{request.employeeName}</p>
                                <p className="text-xs text-gray-500">{request.id}</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-1.5 text-sm font-bold text-primary border border-primary/30">
                              {formatNumber(request.amount)} WAT
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <p>{new Date(request.createdAt).toLocaleString()}</p>
                            <span className="text-primary font-medium">Status: {request.status.replace('_', ' ')}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-background-light/10 to-background-light/5 p-6 space-y-4 shadow-xl hover:shadow-2xl transition-all">
                  <header className="pb-3 border-b border-gray-700/50">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <ActivityIcon className="w-5 h-5 text-primary" />
                      Recent Activity
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Approvals, rejections, and token events</p>
                  </header>
                  <ul className="space-y-3">
                    {recentActivity.length === 0 && !overviewLoading && (
                      <li className="rounded-lg border border-gray-700/40 bg-background-dark/40 p-4 text-sm text-gray-400 text-center">
                        No recent activity recorded.
                      </li>
                    )}
                    {recentActivity.map((activity) => {
                      const employeeName = activity.details?.employeeName as string | undefined;
                      const requestedAmount = activity.details?.requestedAmount as number | undefined;
                      
                      return (
                        <li key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-background-dark/40 transition-all">
                          <div
                            className={`mt-1 h-2 w-2 rounded-full ${
                              activity.status === 'SUCCESS'
                                ? 'bg-green-500'
                                : activity.status === 'FAILED'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">
                              <span className="text-white font-semibold">{activity.type.replace(/_/g, ' ')}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>{new Date(activity.createdAt).toLocaleString()}</span>
                              {employeeName && <span>• {employeeName}</span>}
                              {requestedAmount && (
                                <span>• {formatNumber(Number(requestedAmount))} WAT</span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
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

function TokenIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-1H9v-2h2v-3H9V9h2V7h2v2h2v2h-2v3h2v2h-2Z" /></svg>;
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
