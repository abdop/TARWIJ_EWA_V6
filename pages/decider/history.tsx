import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../../src/store';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

const WageAdvanceHistory = dynamic(
  () => import('../../src/components/WageAdvanceHistory'),
  { ssr: false }
);

// Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const RequestIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function DeciderHistoryPage() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  return (
    <>
      <Head>
        <title>History • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Decider Portal</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/decider" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DashboardIcon />
                <span>Dashboard</span>
              </a>
              <a href="/decider/approvals" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <RequestIcon />
                <span>Pending Approvals</span>
              </a>
              <a href="/decider/history" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <HistoryIcon />
                <span>History</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            {/* Header */}
            <header className="bg-background-dark/60 border-b border-gray-800 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Wage Advance History</h2>
                <p className="text-sm text-gray-400 mt-1">
                  View completed and rejected wage advance requests
                </p>
              </div>
              <div className="flex items-center gap-4">
                {user && (
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Logged in as</p>
                    <p className="text-white font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                )}
                <HashConnectButton />
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-8">
              <div className="max-w-6xl mx-auto">
                {!isConnected ? (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">
                      Please connect your HashPack wallet to view wage advance history.
                    </p>
                    <HashConnectButton />
                  </div>
                ) : user && user.category === 'decider' ? (
                  <WageAdvanceHistory />
                ) : (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                    <p className="text-gray-400">
                      Loading user information...
                    </p>
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
