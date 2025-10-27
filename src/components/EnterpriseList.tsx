import { useState, useEffect } from "react";

interface Enterprise {
  id: string;
  name: string;
  symbol: string;
  address: string;
  contactEmail: string;
  bankAccount?: string;
  industry: string;
  token: {
    tokenId: string;
    symbol: string;
    name: string;
    swapContractId?: string;
    settlementDay?: number;
  } | null;
  userCount: number;
  adminCount: number;
  deciderCount: number;
  employeeCount: number;
}

export default function EnterpriseList() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/enterprise/list");
      const data = await response.json();

      if (data.success) {
        setEnterprises(data.data);
      } else {
        setError(data.error || "Failed to fetch enterprises");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch enterprises");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <LoadingSpinner />
          <span className="text-gray-400">Loading enterprises...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchEnterprises}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (enterprises.length === 0) {
    return (
      <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
        <p className="text-gray-400">No enterprises found</p>
        <p className="text-sm text-gray-500 mt-2">
          Click "Add New Enterprise" to create your first enterprise
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {enterprises.map((enterprise) => (
          <div
            key={enterprise.id}
            className="bg-background-light/10 border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setSelectedEnterprise(enterprise)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-white">
                    {enterprise.name}
                  </h3>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
                    {enterprise.symbol}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">{enterprise.industry}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Token ID</p>
                    <p className="text-sm text-white font-mono">
                      {enterprise.token?.tokenId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-sm text-white">{enterprise.userCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deciders</p>
                    <p className="text-sm text-white">{enterprise.deciderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Settlement Day</p>
                    <p className="text-sm text-white">
                      {enterprise.token?.settlementDay || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                <ChevronRightIcon className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise Detail Modal */}
      {selectedEnterprise && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEnterprise(null)}
        >
          <div
            className="bg-background-dark border border-gray-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedEnterprise.name}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedEnterprise.industry}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEnterprise(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Enterprise Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Symbol</p>
                    <p className="text-white">{selectedEnterprise.symbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact Email</p>
                    <p className="text-white">{selectedEnterprise.contactEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-white">{selectedEnterprise.address}</p>
                  </div>
                  {selectedEnterprise.bankAccount && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Bank Account</p>
                      <p className="text-white font-mono">
                        {selectedEnterprise.bankAccount}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedEnterprise.token && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Token Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Token ID</p>
                      <p className="text-white font-mono">
                        {selectedEnterprise.token.tokenId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Token Symbol</p>
                      <p className="text-white">{selectedEnterprise.token.symbol}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Token Name</p>
                      <p className="text-white">{selectedEnterprise.token.name}</p>
                    </div>
                    {selectedEnterprise.token.swapContractId && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Swap Contract ID</p>
                        <p className="text-white font-mono">
                          {selectedEnterprise.token.swapContractId}
                        </p>
                      </div>
                    )}
                    {selectedEnterprise.token.settlementDay && (
                      <div>
                        <p className="text-xs text-gray-500">Settlement Day</p>
                        <p className="text-white">
                          Day {selectedEnterprise.token.settlementDay} of month
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  User Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Admins</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedEnterprise.adminCount}
                    </p>
                  </div>
                  <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Deciders</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedEnterprise.deciderCount}
                    </p>
                  </div>
                  <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Employees</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedEnterprise.employeeCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 p-6">
              <button
                onClick={() => setSelectedEnterprise(null)}
                className="w-full px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
