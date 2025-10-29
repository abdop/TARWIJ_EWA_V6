
function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" />
    </svg>
  );
}

function DirectoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 6h4l1 2h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm1 3v8h14V9H9.62l-1-2H5v2Z" />
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
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import EmployeeTable from '../../src/components/platform-admin/EmployeeTable';
import EditEmployeeModal from '../../src/components/platform-admin/EditEmployeeModal';
import CreateEmployeeModal from '../../src/components/platform-admin/CreateEmployeeModal';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: 'ent_admin' | 'decider' | 'employee' | 'platform_admin';
  entrepriseId: string;
  hedera_id: string;
}

interface Enterprise {
  id: string;
  name: string;
  symbol: string;
}

export default function EmployeeManagement() {
  const { user, isConnected } = useSelector((state: RootState) => state.hashconnect);
  const [employees, setEmployees] = useState<User[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isConnected) {
      fetchData();
    }
  }, [isConnected]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, enterprisesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/enterprises')
      ]);

      const usersData = await usersRes.json();
      const enterprisesData = await enterprisesRes.json();

      if (usersData.success) {
        setEmployees(usersData.users);
      }
      if (enterprisesData.success) {
        setEnterprises(enterprisesData.enterprises);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showNotification('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleEdit = (employee: User) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Employee deleted successfully');
        fetchData();
      } else {
        throw new Error(data.error || 'Failed to delete employee');
      }
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  // Filter to only show employees (not admins, deciders, or platform admins)
  const employeesOnly = employees.filter(emp => emp.category === 'employee');
  
  const filteredEmployees = selectedEnterprise === 'all'
    ? employeesOnly
    : employeesOnly.filter(emp => emp.entrepriseId === selectedEnterprise);

  return (
    <>
      <Head>
        <title>Employee Management • Platform Admin • TARWIJ EWA</title>
      </Head>
      
      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Platform Admin</p>
            </div>
            <nav className="flex flex-col space-y-2">
              <Link href="/platform-admin" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/platform-admin/enterprises" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DirectoryIcon className="w-5 h-5" />
                <span>Enterprises</span>
              </Link>
              <Link href="/platform-admin/employees" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <UsersIcon className="w-5 h-5" />
                <span>Employees</span>
              </Link>
            </nav>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Employee Management</h1>
                  <p className="text-gray-400 mt-1 text-sm">Manage all enterprise employees</p>
                </div>
                <HashConnectButton />
              </div>
            </div>

            <div className="flex-1 p-10">
              <div className="max-w-7xl mx-auto space-y-6">
                {notification && (
                  <div className={`${notification.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'} border rounded-xl p-4`}>
                    {notification.message}
                  </div>
                )}

                {!isConnected ? (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">Please connect your HashPack wallet to access employee management.</p>
                    <HashConnectButton />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <label className="text-gray-400 text-sm font-medium">Filter by Enterprise:</label>
                        <select
                          value={selectedEnterprise}
                          onChange={(e) => setSelectedEnterprise(e.target.value)}
                          className="bg-background-dark/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                        >
                          <option value="all">All Enterprises</option>
                          {enterprises.map((ent) => (
                            <option key={ent.id} value={ent.id}>{ent.name} ({ent.symbol})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Employee</span>
                      </button>
                    </div>

                    <EmployeeTable
                      employees={filteredEmployees}
                      enterprises={enterprises}
                      loading={loading}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {isEditModalOpen && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          enterprises={enterprises}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            showNotification('success', 'Employee updated successfully');
            fetchData();
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {isCreateModalOpen && (
        <CreateEmployeeModal
          enterprises={enterprises}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            showNotification('success', 'Employee created successfully');
            fetchData();
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </>
  );
}
