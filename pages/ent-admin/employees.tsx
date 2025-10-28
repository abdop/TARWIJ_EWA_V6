import { useState, useEffect, useMemo } from 'react';
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

interface Employee {
  id: string;
  name: string;
  accountId: string;
  email: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  hireDate: string;
  totalAdvances: number;
  currentBalance: number;
}

export default function EmployeesPage() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);
  const enterpriseId = user?.entrepriseId;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'employee' | 'ent_admin' | 'decider'>('all');

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

  const employees = overview?.employees ?? [];

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch =
        term.length === 0 ||
        employee.name.toLowerCase().includes(term) ||
        employee.email.toLowerCase().includes(term) ||
        employee.role.toLowerCase().includes(term) ||
        employee.category.toLowerCase().includes(term);

      const matchesCategory =
        filterCategory === 'all' ? true : employee.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [employees, searchTerm, filterCategory]);

  const stats = overview?.stats;

  const categoryCounts = useMemo(
    () => ({
      ent_admin: overview?.stats?.adminCount ?? 0,
      decider: overview?.stats?.deciderCount ?? 0,
      employee: overview?.stats?.employeeCount ?? 0,
    }),
    [overview]
  );

  const formatNumber = (value?: number, fallback = '—') =>
    typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : fallback;

  const formatAmount = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toLocaleString()} WAT` : '—';

  return (
    <>
      <Head>
        <title>Employees • TARWIJ EWA</title>
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
              <a href="/ent-admin/employees" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/30 to-primary/20 text-primary font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
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

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="border-b border-gray-800/50 bg-gradient-to-r from-background-dark/80 via-background-dark/60 to-background-dark/80 backdrop-blur-md px-10 py-5 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Employee Management</h1>
                  <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Manage and monitor your workforce
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-primary/20 to-primary/5 p-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Employees</p>
                        <p className="mt-2 text-4xl font-bold text-white">{formatNumber(stats?.totalEmployees)}</p>
                      </div>
                      <div className="rounded-full bg-primary/20 p-3">
                        <UsersIcon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-green-500/20 to-green-500/5 p-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Wage Advanced</p>
                        <p className="mt-2 text-4xl font-bold text-white">{formatAmount(stats?.totalWageAdvanced)}</p>
                      </div>
                      <div className="rounded-full bg-green-500/20 p-3">
                        <CheckIcon className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-amber-500/20 to-amber-500/5 p-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Pending Amount</p>
                        <p className="mt-2 text-4xl font-bold text-white">{formatAmount(stats?.pendingAmount)}</p>
                      </div>
                      <div className="rounded-full bg-amber-500/20 p-3">
                        <ClockIcon className="w-8 h-8 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="rounded-2xl border border-gray-700/50 bg-background-light/10 p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees by name, email, or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setFilterCategory('all')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          filterCategory === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-background-dark border border-gray-700 text-gray-400 hover:border-primary/50'
                        }`}
                      >
                        All ({formatNumber(stats?.totalEmployees)})
                      </button>
                      <button
                        onClick={() => setFilterCategory('employee')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          filterCategory === 'employee'
                            ? 'bg-primary text-white'
                            : 'bg-background-dark border border-gray-700 text-gray-400 hover:border-primary/50'
                        }`}
                      >
                        Employees ({formatNumber(categoryCounts.employee)})
                      </button>
                      <button
                        onClick={() => setFilterCategory('ent_admin')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          filterCategory === 'ent_admin'
                            ? 'bg-primary text-white'
                            : 'bg-background-dark border border-gray-700 text-gray-400 hover:border-primary/50'
                        }`}
                      >
                        Admins ({formatNumber(categoryCounts.ent_admin)})
                      </button>
                      <button
                        onClick={() => setFilterCategory('decider')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          filterCategory === 'decider'
                            ? 'bg-primary text-white'
                            : 'bg-background-dark border border-gray-700 text-gray-400 hover:border-primary/50'
                        }`}
                      >
                        Deciders ({formatNumber(categoryCounts.decider)})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Employee Cards */}
                {overviewLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No employees match your filters.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterCategory('all');
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-background-light/10 to-background-light/5 p-6 transition-all hover:scale-105 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {employee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{employee.name}</h3>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">{employee.category.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
                            {employee.role || 'Team member'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <EmailIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 truncate">{employee.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <WalletIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 font-mono text-xs">{employee.accountId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BuildingIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 capitalize">{employee.category.replace('_', ' ')}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-400">Lifetime Advanced</p>
                              <p className="text-lg font-bold text-white">{formatAmount(employee.lifetimeAdvanced)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Pending Amount</p>
                              <p className="text-lg font-bold text-primary">{formatAmount(employee.pendingAmount)}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-400">
                            <p>Requests: <span className="text-gray-200 font-semibold">{formatNumber(employee.requestCount)}</span></p>
                            <p>Last activity: <span className="text-gray-200 font-semibold">{employee.lastRequestAt ? new Date(employee.lastRequestAt).toLocaleDateString() : '—'}</span></p>
                          </div>
                        </div>

                        <button className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-all">
                          View Activity
                        </button>
                      </div>
                    ))}
                  </div>
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

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polyline points="20 6 9 17 4 12"/></svg>;
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

function EmailIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M3 21h18M3 7v14M21 7v14M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1M7 3h10v4H7z"/></svg>;
}

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
}