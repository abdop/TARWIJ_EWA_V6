import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import Head from 'next/head';

export default function UserDashboard() {
  const { user, accountId } = useSelector((state: RootState) => state.hashconnect);

  return (
    <>
      <Head>
        <title>User • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">User Portal</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/user" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/user/wallet" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <WalletIcon className="w-5 h-5" />
                <span>My Wallet</span>
              </a>
              <a href="/user/transactions" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <TransactionIcon className="w-5 h-5" />
                <span>Transactions</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          <main className="flex-1 p-10 bg-background-dark/90 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              <header>
                <h2 className="text-4xl font-bold text-white">User Dashboard</h2>
                <p className="text-gray-400 mt-2">Manage your tokens and transactions</p>
              </header>

              {user && (
                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Welcome, {user.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Account ID:</span>
                      <p className="text-white font-mono">{accountId}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="text-white">{user.email}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Token Balance</p>
                  <p className="text-4xl font-bold text-white mt-3">1,250</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Transactions</p>
                  <p className="text-4xl font-bold text-white mt-3">23</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-4xl font-bold text-white mt-3">$450</p>
                </div>
              </section>

              <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
                <div className="text-center text-gray-400 py-8">
                  No recent transactions
                </div>
              </section>
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

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>;
}

function TransactionIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>;
}
