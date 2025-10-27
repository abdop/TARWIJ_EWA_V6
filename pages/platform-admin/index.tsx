import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

const AddEnterpriseModal = dynamic(
  () => import('../../src/components/AddEnterpriseModal'),
  { ssr: false }
);

const EnterpriseList = dynamic(
  () => import('../../src/components/EnterpriseList'),
  { ssr: false }
);

export default function PlatformAdminDashboard() {
  const { user, isConnected } = useSelector((state: RootState) => state.hashconnect);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleCreateEnterprise = async (enterpriseInfo: any, users: any[]) => {
    setIsSubmitting(true);
    try {
      // All sensitive configuration is handled on the backend
      const response = await fetch('/api/enterprise/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enterpriseInfo,
          users,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          type: 'success',
          message: `Enterprise "${enterpriseInfo.name}" created successfully!`,
        });
        setIsModalOpen(false);
        // Refresh the enterprise list
        window.location.reload();
      } else {
        throw new Error(data.details || data.error || 'Failed to create enterprise');
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Failed to create enterprise',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <a href="/platform-admin/employees" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
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

              {notification && (
                <div
                  className={`${
                    notification.type === 'success'
                      ? 'bg-green-500/10 border-green-500/50 text-green-400'
                      : 'bg-red-500/10 border-red-500/50 text-red-400'
                  } border rounded-xl p-4 flex items-center justify-between`}
                >
                  <p>{notification.message}</p>
                  <button
                    onClick={() => setNotification(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {!isConnected ? (
                <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Please connect your HashPack wallet to access platform admin features.
                  </p>
                  <HashConnectButton />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Enterprises</h2>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Add New Enterprise</span>
                    </button>
                  </div>

                  <EnterpriseList />
                </>
              )}
              </div>
            </div>

            {isModalOpen && (
              <AddEnterpriseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateEnterprise}
              />
            )}
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

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
