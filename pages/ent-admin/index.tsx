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

export default function EntAdminDashboard() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <>
      <Head>
        <title>Enterprise Admin • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Enterprise Admin</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/ent-admin" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/ent-admin/employees" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
              </a>
              <a href="/ent-admin/tokens" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <TokenIcon className="w-5 h-5" />
                <span>Token Management</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            {/* Top Navigation Bar */}
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Enterprise Dashboard</h1>
                  <p className="text-gray-400 mt-1 text-sm">Manage your enterprise and employees</p>
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

            {/* Main Content */}
            <div className="flex-1 p-10">
              <div className="max-w-6xl mx-auto space-y-8">

              {user && (
                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Welcome, {user.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Account ID:</span>
                      <p className="text-white font-mono">{accountId}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Role:</span>
                      <p className="text-primary font-semibold">{user.role}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Enterprise:</span>
                      <p className="text-white">{user.entrepriseId}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <article className="rounded-xl border border-gray-700 bg-background-light/10 p-6">
                  <p className="text-sm text-gray-400">Total Employees</p>
                  <p className="mt-3 text-3xl font-bold text-white">45</p>
                  <p className="mt-2 text-xs text-gray-500">Active in system</p>
                </article>
                <article className="rounded-xl border border-gray-700 bg-background-light/10 p-6">
                  <p className="text-sm text-gray-400">Pending Requests</p>
                  <p className="mt-3 text-3xl font-bold text-white">8</p>
                  <p className="mt-2 text-xs text-gray-500">Awaiting decider signatures</p>
                </article>
                <article className="rounded-xl border border-gray-700 bg-background-light/10 p-6">
                  <p className="text-sm text-gray-400">Token Balance</p>
                  <p className="mt-3 text-3xl font-bold text-white">50,000 WAT</p>
                  <p className="mt-2 text-xs text-gray-500">Available for advances</p>
                </article>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-xl border border-gray-700 bg-background-light/10 p-6 space-y-4">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Pending wage advance requests</h3>
                      <p className="text-sm text-gray-400">Newest requests requiring approval.</p>
                    </div>
                    <a href="/ent-admin/requests" className="text-sm font-semibold text-primary hover:text-primary/80">
                      Manage all requests
                    </a>
                  </header>
                  <ul className="space-y-4">
                    <li className="rounded-lg border border-gray-700 bg-background-dark/60 p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Andrea Howell</p>
                          <p className="text-xs text-gray-500">Request ID: REQ-2345</p>
                        </div>
                        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                          350 WAT
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted 10/16/2025, 10:42:00 AM
                      </p>
                    </li>
                    <li className="rounded-lg border border-gray-700 bg-background-dark/60 p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Lee Carter</p>
                          <p className="text-xs text-gray-500">Request ID: REQ-2342</p>
                        </div>
                        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                          420 WAT
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted 10/15/2025, 4:18:00 PM
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-700 bg-background-light/10 p-6 space-y-4">
                  <header>
                    <h3 className="text-xl font-semibold text-white">Recent activity</h3>
                    <p className="text-sm text-gray-400">Approvals, rejections, and token events.</p>
                  </header>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm text-gray-300">Approved wage advance for Andrea Howell (350 WAT)</p>
                        <p className="text-xs text-gray-500">10/16/2025, 11:03:00 AM</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm text-gray-300">Received 2,000 WAT from central treasury</p>
                        <p className="text-xs text-gray-500">10/15/2025, 9:11:00 AM</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm text-gray-300">Rejected request from Jamie Porter</p>
                        <p className="text-xs text-gray-500">10/14/2025, 6:40:00 PM</p>
                      </div>
                    </li>
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
