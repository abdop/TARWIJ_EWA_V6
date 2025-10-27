import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import Head from 'next/head';

export default function ShopAdminDashboard() {
  const { user, accountId } = useSelector((state: RootState) => state.hashconnect);

  return (
    <>
      <Head>
        <title>Shop Admin • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Shop Admin</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/shop-admin" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/shop-admin/staff" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <UsersIcon className="w-5 h-5" />
                <span>Staff Management</span>
              </a>
              <a href="/shop-admin/sales" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <ShopIcon className="w-5 h-5" />
                <span>Sales</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          <main className="flex-1 p-10 bg-background-dark/90 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              <header>
                <h2 className="text-4xl font-bold text-white">Shop Dashboard</h2>
                <p className="text-gray-400 mt-2">Manage your shop and staff</p>
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
                      <span className="text-gray-400">Role:</span>
                      <p className="text-primary font-semibold">{user.role}</p>
                    </div>
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Today's Sales</p>
                  <p className="text-4xl font-bold text-white mt-3">$2,450</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Active Staff</p>
                  <p className="text-4xl font-bold text-white mt-3">8</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Transactions</p>
                  <p className="text-4xl font-bold text-white mt-3">156</p>
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

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>;
}

function ShopIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" /></svg>;
}
