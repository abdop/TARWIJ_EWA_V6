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
      <div className="bg-background-light/20 border border-gray-700/70 rounded-xl p-8 text-center">
        <div className="flex items-center justify-center gap-3 text-base">
          <LoadingSpinner />
          <span className="text-gray-300">Loading enterprises...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/15 border border-red-500/60 rounded-xl p-6">
        <p className="text-red-300 text-base font-medium">{error}</p>
        <button
          onClick={fetchEnterprises}
          className="mt-4 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-red-100 transition-colors text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (enterprises.length === 0) {
    return (
      <div className="bg-background-light/20 border border-gray-700/70 rounded-xl p-8 text-center">
        <p className="text-gray-200 text-base font-medium">No enterprises found</p>
        <p className="text-sm text-gray-400 mt-2">
          Click "Add New Enterprise" to create your first enterprise
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5">
        {enterprises.map((enterprise) => (
          <div
            key={enterprise.id}
            className="bg-background-light/15 border border-gray-700/70 rounded-2xl p-6 sm:p-7 hover:border-primary/60 hover:shadow-lg/20 transition-all cursor-pointer"
            onClick={() => setSelectedEnterprise(enterprise)}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    {enterprise.name}
                  </h3>
                  <span className="px-2.5 py-1 bg-primary/25 text-primary text-xs font-semibold rounded-md uppercase tracking-wide">
                    {enterprise.symbol}
                  </span>
                </div>
                <p className="text-base text-gray-300 mb-6 leading-relaxed">{enterprise.industry}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                  <InfoCell label="Token ID" value={enterprise.token?.tokenId || 'N/A'} mono />
                  <InfoCell label="Swap Contract ID" value={enterprise.token?.swapContractId || 'N/A'} mono />
                  <InfoCell label="Total Users" value={enterprise.userCount.toLocaleString()} />
                  <InfoCell label="Admins" value={enterprise.adminCount.toLocaleString()} />
                  <InfoCell label="Deciders" value={enterprise.deciderCount.toLocaleString()} />
                  <InfoCell
                    label="Settlement Day"
                    value={enterprise.token?.settlementDay ? `Day ${enterprise.token.settlementDay}` : 'N/A'}
                  />
                </div>
              </div>

              <div className="md:ml-4 flex md:block items-center justify-end">
                <ChevronRightIcon className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise Detail Modal */}
      {selectedEnterprise && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEnterprise(null)}
        >
          <div
            className="bg-background-dark border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-700/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    {selectedEnterprise.name}
                  </h2>
                  <p className="text-base text-gray-300 mt-2 leading-relaxed">
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

            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-xl font-semibold text-white mb-5">Enterprise Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailCell label="Symbol" value={selectedEnterprise.symbol} />
                  <DetailCell label="Contact Email" value={selectedEnterprise.contactEmail} />
                  <DetailCell label="Address" value={selectedEnterprise.address} span />
                  {selectedEnterprise.bankAccount && (
                    <DetailCell label="Bank Account" value={selectedEnterprise.bankAccount} mono span />
                  )}
                </div>
              </section>

              {selectedEnterprise.token && (
                <section>
                  <h3 className="text-xl font-semibold text-white mb-5">Token Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <DetailCell label="Token ID" value={selectedEnterprise.token.tokenId} mono />
                    <DetailCell label="Token Symbol" value={selectedEnterprise.token.symbol} />
                    <DetailCell label="Token Name" value={selectedEnterprise.token.name} span />
                    <DetailCell
                      label="Swap Contract ID"
                      value={selectedEnterprise.token.swapContractId || 'N/A'}
                      mono
                      span
                    />
                    <DetailCell
                      label="Settlement Day"
                      value={
                        selectedEnterprise.token.settlementDay
                          ? `Day ${selectedEnterprise.token.settlementDay} of month`
                          : 'N/A'
                      }
                    />
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xl font-semibold text-white mb-5">User Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <StatBlock label="Admins" value={selectedEnterprise.adminCount} />
                  <StatBlock label="Deciders" value={selectedEnterprise.deciderCount} />
                  <StatBlock label="Employees" value={selectedEnterprise.employeeCount} />
                </div>
              </section>
            </div>

            <div className="border-t border-gray-700/80 p-6 bg-background-dark/80">
              <button
                onClick={() => setSelectedEnterprise(null)}
                className="w-full px-6 py-2.5 bg-primary rounded-lg text-white font-semibold hover:bg-primary/90 transition-colors"
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
    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
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

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-background-dark/60 border border-gray-700/70 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p
        className={`mt-2 text-sm sm:text-base font-medium text-white ${mono ? 'font-mono tracking-tight' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailCell({
  label,
  value,
  span,
  mono,
}: {
  label: string;
  value: string;
  span?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`${span ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className={`mt-2 text-base text-white ${mono ? 'font-mono tracking-tight' : ''}`}>{value}</p>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background-light/10 border border-gray-700/70 rounded-lg p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className="text-3xl font-bold text-white mt-3">{value.toLocaleString()}</p>
    </div>
  );
}
