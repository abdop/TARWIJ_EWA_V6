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

export default function PlatformAdminDashboard() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

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
              <a href="/platform-admin" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/platform-admin/system" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <SettingsIcon className="w-5 h-5" />
                <span>System Settings</span>
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

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Total Enterprises</p>
                  <p className="text-4xl font-bold text-white mt-3">12</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-4xl font-bold text-white mt-3">248</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Total Tokens</p>
                  <p className="text-4xl font-bold text-white mt-3">1.2M</p>
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
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" />
    </svg>
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.14 12.94a7.986 7.986 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.94 7.94 0 0 0-1.62-.94l-.36-2.54A.5.5 0 0 0 14.9 2h-3.8a.5.5 0 0 0-.5.42L10.24 4.9a7.94 7.94 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L3.7 8.42a.5.5 0 0 0 .12.64l2.03 1.58a7.986 7.986 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.37 1.05.68 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.8a.5.5 0 0 0 .5-.42l.36-2.54c.57-.26 1.12-.57 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z" />
    </svg>
  );
}
