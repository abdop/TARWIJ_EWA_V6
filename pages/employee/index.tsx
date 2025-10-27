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

const WageAdvanceRequest = dynamic(
  () => import('../../src/components/WageAdvanceRequest'),
  { ssr: false }
);

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

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
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
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
                  <p className="text-4xl font-bold text-white mt-3">2,500</p>
                  <p className="text-xs text-gray-500 mt-2">Tokens</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Pending Requests</p>
                  <p className="text-4xl font-bold text-white mt-3">1</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Total Received</p>
                  <p className="text-4xl font-bold text-white mt-3">15K</p>
                  <p className="text-xs text-gray-500 mt-2">Lifetime</p>
                </div>
              </section>

              {!isConnected ? (
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Please connect your HashPack wallet to request wage advances.
                  </p>
                  <HashConnectButton />
                </div>
              ) : (
                <WageAdvanceRequest />
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
