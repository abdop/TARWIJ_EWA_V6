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

interface EmployeeTableProps {
  employees: User[];
  enterprises: Enterprise[];
  loading: boolean;
  onEdit: (employee: User) => void;
  onDelete: (employeeId: string) => void;
}

export default function EmployeeTable({ employees, enterprises, loading, onEdit, onDelete }: EmployeeTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-gray-400 mt-4">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-light/20 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Enterprise</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Hedera ID</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const enterprise = enterprises.find(e => e.id === employee.entrepriseId);
                return (
                  <tr key={employee.id} className="hover:bg-background-light/5">
                    <td className="px-6 py-4 text-white font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-gray-300">{employee.email}</td>
                    <td className="px-6 py-4 text-gray-300">{employee.role}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {enterprise ? `${enterprise.name} (${enterprise.symbol})` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">{employee.hedera_id}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(employee)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(employee.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
