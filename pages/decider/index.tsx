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

const DeciderApprovalList = dynamic(
  () => import('../../src/components/DeciderApprovalList'),
  { ssr: false }
);

export default function DeciderDashboard() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  return (
    <>
      <Head>
        <title>Decider • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Decider Portal</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/decider" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/decider/approvals" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <RequestIcon className="w-5 h-5" />
                <span>Pending Approvals</span>
              </a>
              <a href="/decider/history" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <HistoryIcon className="w-5 h-5" />
                <span>History</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Approval Dashboard</h1>
                  <p className="text-gray-400 mt-1 text-sm">Review and approve wage advance requests</p>
                </div>
                <div className="flex items-center gap-4">
                  {isConnected && user && user.category === 'decider' && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Connected as</p>
                      <p className="text-white font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.category}</p>
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
                  <p className="text-sm text-gray-400">Pending Approvals</p>
                  <p className="text-4xl font-bold text-white mt-3">5</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Approved Today</p>
                  <p className="text-4xl font-bold text-white mt-3">12</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Total This Month</p>
                  <p className="text-4xl font-bold text-white mt-3">89</p>
                </div>
              </section>

              {!isConnected ? (
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Please connect your HashPack wallet to view pending approvals.
                  </p>
                  <HashConnectButton />
                </div>
              ) : (
                <DeciderApprovalList />
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

function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" /></svg>;
}
