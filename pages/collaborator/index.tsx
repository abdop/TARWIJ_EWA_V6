import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import Head from 'next/head';

export default function CollaboratorDashboard() {
  const { user, accountId } = useSelector((state: RootState) => state.hashconnect);

  return (
    <>
      <Head>
        <title>Collaborator • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Collaborator</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <a href="/collaborator" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/collaborator/tasks" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <TaskIcon className="w-5 h-5" />
                <span>My Tasks</span>
              </a>
              <a href="/collaborator/schedule" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <ScheduleIcon className="w-5 h-5" />
                <span>Schedule</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">
              Connected via HashPack
            </div>
          </aside>

          <main className="flex-1 p-10 bg-background-dark/90 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              <header>
                <h2 className="text-4xl font-bold text-white">Collaborator Dashboard</h2>
                <p className="text-gray-400 mt-2">Manage your tasks and schedule</p>
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
                  <p className="text-sm text-gray-400">Tasks Today</p>
                  <p className="text-4xl font-bold text-white mt-3">6</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-4xl font-bold text-white mt-3">4</p>
                </div>
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400">Hours This Week</p>
                  <p className="text-4xl font-bold text-white mt-3">32</p>
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

function TaskIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>;
}

function ScheduleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>;
}
