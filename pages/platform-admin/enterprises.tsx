import { useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import usePlatformOverview, { PlatformEnterpriseSummary } from '../../src/hooks/usePlatformOverview';

const HashConnectButton = dynamic(() => import('../../src/components/HashConnectButton'), {
  ssr: false,
});

const AddEnterpriseModal = dynamic(() => import('../../src/components/AddEnterpriseModal'), {
  ssr: false,
});

const EnterpriseList = dynamic(() => import('../../src/components/EnterpriseList'), {
  ssr: false,
});

export default function EnterpriseDirectoryPage() {
  const { user, isConnected } = useSelector((state: RootState) => state.hashconnect);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    data: overview,
    loading,
    error,
    refresh,
  } = usePlatformOverview({ enabled: isConnected, refreshIntervalMs: 60_000 });

  const enterpriseStats = useMemo(() => {
    if (!overview) {
      return [] as EnterpriseSummaryCard[];
    }

    const enterprises = overview.enterprises;
    const withTokens = enterprises.filter((enterprise) => enterprise.token !== null).length;
    const withoutAdmins = enterprises.filter((enterprise) => enterprise.userCounts.admin === 0).length;
    const pendingExposure = enterprises.reduce((total, enterprise) => total + enterprise.wageRequests.pendingAmount, 0);

    return [
      {
        label: 'Enterprises onboarded',
        value: overview.stats.totalEnterprises.toLocaleString(),
        helper: `${withTokens.toLocaleString()} with settlement tokens configured`,
      },
      {
        label: 'Total admins',
        value: overview.stats.totalAdmins.toLocaleString(),
        helper: `${withoutAdmins === 0 ? 'All enterprises covered' : `${withoutAdmins} enterprise(s) without admins`}`,
      },
      {
        label: 'Employees connected',
        value: overview.stats.totalEmployees.toLocaleString(),
        helper: `${overview.stats.totalPlatformUsers.toLocaleString()} total users`,
      },
      {
        label: 'Pending exposure',
        value: formatWAT(pendingExposure),
        helper: `${overview.stats.pendingWageRequests.toLocaleString()} wage requests awaiting action`,
      },
    ];
  }, [overview]);

  const topPendingEnterprises = useMemo(() => {
    if (!overview) {
      return [] as PlatformEnterpriseSummary[];
    }

    return overview.enterprises
      .filter((enterprise) => enterprise.wageRequests.pendingAmount > 0)
      .sort((a, b) => b.wageRequests.pendingAmount - a.wageRequests.pendingAmount)
      .slice(0, 5);
  }, [overview]);

  const handleCreateEnterprise = async (enterpriseInfo: any, users: any[]) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enterprise/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enterpriseInfo, users }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.details || data.error || 'Failed to create enterprise');
      }

      setNotification({
        type: 'success',
        message: `Enterprise "${enterpriseInfo.name}" created successfully!`,
      });
      setIsModalOpen(false);
      setListVersion((current) => current + 1);
      refresh();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to create enterprise',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Enterprise Directory • Platform Admin • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Platform Admin</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <Link href="/platform-admin" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/platform-admin/enterprises" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DirectoryIcon className="w-5 h-5" />
                <span>Enterprises</span>
              </Link>
              <Link href="/platform-admin/employees" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
              </Link>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">Connected via HashPack</div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">Enterprise Directory</h1>
                  <p className="text-gray-400 mt-1 text-sm">Browse, onboard, and monitor every enterprise on TARWIJ EWA.</p>
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
                {notification && (
                  <div
                    className={`$${notification.type === 'success' ? 'bg-green-500/10 border-green-500/40 text-green-300' : 'bg-red-500/10 border-red-500/40 text-red-300'} border rounded-xl p-4 flex items-center justify-between`}
                  >
                    <p>{notification.message}</p>
                    <button
                      onClick={() => setNotification(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {!isConnected ? (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">Connect your HashPack wallet to manage enterprises.</p>
                    <HashConnectButton />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Enterprise Health</h2>
                        <p className="text-sm text-gray-500">Quick insight into onboarding coverage and configuration readiness.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => refresh()}
                          disabled={loading}
                          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-primary/60 transition"
                        >
                          {loading ? 'Refreshing…' : 'Refresh data'}
                        </button>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                          disabled={isSubmitting}
                        >
                          <PlusIcon className="w-5 h-5" />
                          <span>{isSubmitting ? 'Creating…' : 'Add New Enterprise'}</span>
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-300 flex items-center justify-between">
                        <p>Failed to load enterprise overview: {error}</p>
                        <button
                          onClick={() => refresh()}
                          className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-sm text-red-100 transition"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {!overview && loading && (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="bg-background-light/10 border border-gray-800 rounded-xl p-6 animate-pulse">
                            <div className="h-3 w-24 bg-gray-700/70 rounded mb-4" />
                            <div className="h-7 w-32 bg-gray-700/70 rounded" />
                          </div>
                        ))}
                      </div>
                    )}

                    {overview && (
                      <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          {enterpriseStats.map((card) => (
                            <StatsCard key={card.label} {...card} />
                          ))}
                        </section>

                        <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-semibold text-white">Pending exposure spotlight</h2>
                              <p className="text-sm text-gray-500">Top enterprises by pending wage amount requiring review.</p>
                            </div>
                            <Link
                              href="/platform-admin"
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              View platform dashboard
                            </Link>
                          </div>
                          <PendingExposureList enterprises={topPendingEnterprises} />
                        </section>
                      </>
                    )}

                    <section className="bg-background-light/10 border border-gray-700 rounded-xl overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 px-6 py-4">
                        <div>
                          <h2 className="text-xl font-semibold text-white">Directory</h2>
                          <p className="text-sm text-gray-500">Search and inspect all enterprises configured on the platform.</p>
                        </div>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                          disabled={isSubmitting}
                        >
                          Create Enterprise
                        </button>
                      </div>
                      <div className="p-6">
                        <EnterpriseList key={listVersion} />
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {isModalOpen && (
        <AddEnterpriseModal
          isOpen={isModalOpen}
          onClose={() => {
            if (!isSubmitting) {
              setIsModalOpen(false);
            }
          }}
          onSubmit={handleCreateEnterprise}
        />
      )}
    </>
  );
}

type EnterpriseSummaryCard = {
  label: string;
  value: string;
  helper?: string;
};

function StatsCard({ label, value, helper }: EnterpriseSummaryCard) {
  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-white tracking-tight">{value}</p>
      {helper && <p className="text-xs text-gray-500 mt-3">{helper}</p>}
    </div>
  );
}

function PendingExposureList({ enterprises }: { enterprises: PlatformEnterpriseSummary[] }) {
  if (!enterprises.length) {
    return <p className="text-sm text-gray-500">No pending wage exposure across enterprises.</p>;
  }

  return (
    <ul className="space-y-3 mt-4">
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
  );
}

function formatWAT(amount: number) {
  return `${(amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} WAT`;
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" />
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

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
