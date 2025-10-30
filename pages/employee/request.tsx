import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

const WageAdvanceRequest = dynamic(
  () => import('../../src/components/WageAdvanceRequest'),
  { ssr: false }
);

export default function EmployeeRequestPage() {
  const { user, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const guidanceItems = useMemo(
    () => [
      {
        title: 'Know your limits',
        description:
          'You can request up to your earned-but-unpaid wage balance. Requests above the limit will be rejected automatically.',
      },
      {
        title: 'Wallet signature required',
        description:
          'Keep HashPack open. You may be prompted to sign a token association or schedule transaction before approval.',
      },
      {
        title: 'Track approvals',
        description:
          'Deciders review requests in the order received. You will get an in-app notification and email when the status changes.',
      },
    ],
    []
  );

  return (
    <>
      <Head>
        <title>Request Advance • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/employee" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/employee/request" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
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
                  <h1 className="text-3xl font-bold text-white">Request a Wage Advance</h1>
                  <p className="text-gray-400 mt-1 text-sm">Submit a new request and monitor its progress.</p>
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
              <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                  {!isConnected ? (
                    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                      <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                      <p className="text-gray-400 mb-6">
                        Connect your HashPack wallet to start a wage advance request.
                      </p>
                      <HashConnectButton />
                    </div>
                  ) : (
                    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                      <WageAdvanceRequest />
                    </div>
                  )}

                  <section className="rounded-xl border border-gray-700 bg-background-light/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Request Status</h2>
                    <div className="rounded-lg border border-dashed border-gray-700/60 bg-background-dark/60 p-6 text-sm text-gray-400">
                      Real-time tracking for your latest requests will appear here once we connect the live data feed.
                    </div>
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-xl border border-primary/30 bg-primary/10 p-6 shadow-lg shadow-primary/10">
                    <h2 className="text-lg font-semibold text-white mb-3">Tips before you submit</h2>
                    <ul className="space-y-4">
                      {guidanceItems.map((item) => (
                        <li key={item.title} className="bg-background-dark/50 border border-primary/20 rounded-lg p-4">
                          <p className="text-sm font-semibold text-primary">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-300 leading-relaxed">{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-gray-700 bg-background-light/5 p-6">
                    <h2 className="text-lg font-semibold text-white mb-3">Need help?</h2>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Contact your payroll administrator if you encounter any issues or have questions about your wage advance eligibility.
                    </p>
                    <a
                      href="mailto:support@tarwijewa.com"
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary/80 px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary"
                    >
                      Email Support
                    </a>
                  </section>
                </aside>
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
