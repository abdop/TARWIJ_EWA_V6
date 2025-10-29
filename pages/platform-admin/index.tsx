import { useMemo } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import usePlatformOverview, {
  PlatformEnterpriseSummary,
  PlatformRecentActivityItem,
  PlatformWageTrendPoint,
} from '../../src/hooks/usePlatformOverview';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

export default function PlatformAdminDashboard() {
  const { user, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = usePlatformOverview({
    enabled: isConnected ? true : false,
    refreshIntervalMs: 60_000,
  });

  const statsCards = useMemo(() => {
    if (!overview) {
      return [];
    }
    const stats = overview.stats;
    return [
      {
        label: 'Total Enterprises',
        value: stats.totalEnterprises.toLocaleString(),
        helper: `${stats.totalAdmins} admins · ${stats.totalDeciders} deciders`,
      },
      {
        label: 'Active Employees',
        value: stats.totalEmployees.toLocaleString(),
        helper: `${stats.totalPlatformUsers.toLocaleString()} total users`,
      },
      {
        label: 'Lifetime Wage Volume',
        value: formatWAT(stats.totalAdvancedAmount),
        helper: `${stats.completedWageRequests.toLocaleString()} approved`,
      },
      {
        label: 'Pending Exposure',
        value: formatWAT(stats.pendingAmount),
        helper: `${stats.pendingWageRequests.toLocaleString()} pending requests`,
      },
    ];
  }, [overview]);

  const topPendingByAmount = useMemo(() => {
    if (!overview) {
      return [];
    }
    return overview.enterprises
      .filter((enterprise) => enterprise.wageRequests.pendingAmount > 0)
      .sort((a, b) => b.wageRequests.pendingAmount - a.wageRequests.pendingAmount)
      .slice(0, 5);
  }, [overview]);

  return (
    <>
      <Head>
        <title>Platform Admin • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Platform Admin</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <Link href="/platform-admin" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/platform-admin/enterprises" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DirectoryIcon className="w-5 h-5" />
                <span>Enterprises</span>
              </Link>
              <Link href="/platform-admin/employees" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
              </Link>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">Platform Dashboard</h1>
                  <p className="text-gray-400 mt-1 text-sm">Manage the entire TARWIJ EWA platform</p>
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
                {!isConnected ? (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">
                      Please connect your HashPack wallet to access platform admin features.
                    </p>
                    <HashConnectButton />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Platform Health Overview</h2>
                        <p className="text-sm text-gray-500">
                          Real-time visibility into enterprise adoption and wage advance performance.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => refreshOverview()}
                          disabled={overviewLoading}
                          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-primary/60 transition"
                        >
                          {overviewLoading ? 'Refreshing…' : 'Refresh data'}
                        </button>
                        <Link
                          href="/platform-admin/enterprises"
                          className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                          <DirectoryIcon className="w-5 h-5" />
                          <span>Manage Enterprises</span>
                        </Link>
                      </div>
                    </div>

                    {overviewError && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-300 flex items-center justify-between">
                        <p>Failed to load platform overview: {overviewError}</p>
                        <button
                          onClick={() => refreshOverview()}
                          className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-sm text-red-100 transition"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {overviewLoading && !overview && (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="bg-background-light/10 border border-gray-800 rounded-xl p-6 animate-pulse"
                          >
                            <div className="h-3 w-24 bg-gray-700/70 rounded mb-4" />
                            <div className="h-7 w-32 bg-gray-700/70 rounded" />
                          </div>
                        ))}
                      </div>
                    )}

                    {overview && (
                      <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          {statsCards.map((card) => (
                            <StatsCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
                          ))}
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                          <WageTrendCard data={overview.wageRequestTrend} />
                          <PendingExposureCard enterprises={topPendingByAmount} />
                        </section>

                        <section className="grid gap-6 lg:grid-cols-2">
                          <EnterpriseLeaderboard
                            title="Top Enterprises by Employees"
                            subtitle="Headcount across all users"
                            enterprises={overview.topEnterprisesByEmployees}
                            formatMetric={(enterprise) => `${enterprise.userCounts.employee.toLocaleString()} employees`}
                          />
                          <EnterpriseLeaderboard
                            title="Top Enterprises by Wage Volume"
                            subtitle="Lifetime WAT advanced"
                            enterprises={overview.topEnterprisesByAdvanceVolume}
                            formatMetric={(enterprise) => formatWAT(enterprise.wageRequests.totalAdvanced)}
                          />
                        </section>

                        <ActivityFeed activities={overview.recentActivity} />
                      </>
                    )}
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

function StatsCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-white tracking-tight">{value}</p>
      {helper && <p className="text-xs text-gray-500 mt-3">{helper}</p>}
    </div>
  );
}

function WageTrendCard({ data }: { data: PlatformWageTrendPoint[] }) {
  if (!data.length) {
    return (
      <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Wage Requests (last 30 days)</h3>
        <p className="text-sm text-gray-500">No wage activity recorded in the selected window.</p>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((point) => point.total), 1);
  const lastSeven = data.slice(-7);
  const latest = data[data.length - 1];

  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Wage Requests (last 30 days)</h3>
          <p className="text-sm text-gray-500">Completed, pending, and rejected wage requests across the platform.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Latest day</p>
          <p className="text-white font-semibold">{latest.total.toLocaleString()} total</p>
        </div>
      </div>

      <div className="flex items-end gap-1 h-32">
        {data.map((point) => {
          const completedHeight = (point.completed / maxTotal) * 100;
          const pendingHeight = (point.pending / maxTotal) * 100;
          const rejectedHeight = (point.rejected / maxTotal) * 100;

          return (
            <div key={point.dateKey} className="flex-1 flex items-end justify-center" title={`${point.dateKey}\nTotal: ${point.total.toLocaleString()}`}>
              <div className="flex flex-col justify-end w-full max-w-[18px] h-full">
                <span className="bg-green-500/80 rounded-t-sm" style={{ height: `${completedHeight}%` }} />
                <span className="bg-yellow-500/80" style={{ height: `${pendingHeight}%` }} />
                <span className="bg-red-500/80" style={{ height: `${rejectedHeight}%` }} />
                <span
                  className="bg-primary/20"
                  style={{ height: `${Math.max((point.total / maxTotal) * 100 - completedHeight - pendingHeight - rejectedHeight, 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">7-day total</p>
          <p className="text-white font-semibold">{sum(lastSeven.map((point) => point.total)).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Completed</p>
          <p className="text-green-400 font-semibold">{sum(lastSeven.map((point) => point.completed)).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Pending</p>
          <p className="text-yellow-400 font-semibold">{sum(lastSeven.map((point) => point.pending)).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function PendingExposureCard({ enterprises }: { enterprises: PlatformEnterpriseSummary[] }) {
  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Pending Exposure</h3>
      <p className="text-sm text-gray-500 mb-4">
        Enterprises with the highest pending balances awaiting approval or signature.
      </p>
      {enterprises.length === 0 ? (
        <p className="text-sm text-gray-500">No outstanding pending requests across enterprises.</p>
      ) : (
        <ul className="space-y-3">
          {enterprises.map((enterprise) => (
            <li key={enterprise.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium">{enterprise.name}</p>
                <p className="text-xs text-gray-500">{enterprise.wageRequests.pending.toLocaleString()} pending requests</p>
              </div>
              <p className="text-primary font-semibold">{formatWAT(enterprise.wageRequests.pendingAmount)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EnterpriseLeaderboard({
  title,
  subtitle,
  enterprises,
  formatMetric,
}: {
  title: string;
  subtitle: string;
  enterprises: PlatformEnterpriseSummary[];
  formatMetric: (enterprise: PlatformEnterpriseSummary) => string;
}) {
  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      {enterprises.length === 0 ? (
        <p className="text-sm text-gray-500">No enterprises available.</p>
      ) : (
        <ul className="space-y-3">
          {enterprises.map((enterprise, index) => (
            <li key={enterprise.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-6 text-right">{index + 1}</span>
                <div>
                  <p className="text-white font-medium">{enterprise.name}</p>
                  <p className="text-xs text-gray-500">{enterprise.symbol} · {enterprise.industry}</p>
                </div>
              </div>
              <p className="text-primary font-semibold text-sm">{formatMetric(enterprise)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityFeed({ activities }: { activities: PlatformRecentActivityItem[] }) {
  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-white">Recent Platform Activity</h3>
          <p className="text-sm text-gray-500">Latest DLT operations and wage events captured on the network.</p>
        </div>
      </div>
      <div className="divide-y divide-gray-800">
        {activities.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No DLT activity has been recorded yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium capitalize">{activity.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-500">
                  {activity.enterpriseName ? `${activity.enterpriseName} · ` : ''}
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
                {activity.transactionId && (
                  <p className="text-xs text-gray-600 mt-1 font-mono">Txn: {activity.transactionId}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusPillClass(activity.status)}`}>
                {activity.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function statusPillClass(status: string) {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'APPROVED':
      return 'bg-green-500/20 text-green-300 border border-green-500/40';
    case 'PENDING':
    case 'PENDING_SIGNATURE':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
    default:
      return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  }
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatWAT(amount: number) {
  return `${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WAT`;
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function DirectoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 6h4l1 2h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm1 3v8h14V9H9.62l-1-2H5v2Z" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

