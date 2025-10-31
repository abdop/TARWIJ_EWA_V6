/**
 * Decider Approval Success Modal
 * Shows schedule ID and transaction ID with HashScan links after successful approval signature
 */

interface DeciderApprovalSuccessModalProps {
  result: {
    requestId: string;
    scheduleId: string;
    transactionId: string;
    employeeName: string;
    amount: number; // in cents
    isFullyApproved: boolean;
    remainingSignatures: number;
  };
  onClose: () => void;
}

export default function DeciderApprovalSuccessModal({
  result,
  onClose,
}: DeciderApprovalSuccessModalProps) {
  // Get network from environment (default to testnet)
  const network = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet')
    : 'testnet';

  const getHashScanUrl = (type: 'schedule' | 'transaction', id: string) => {
    return `https://hashscan.io/${network}/${type}/${id}`;
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-green-900/40 to-background-dark border border-green-500/30 rounded-xl max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="border-b border-green-500/30 p-6 bg-green-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Approval Signed Successfully!</h2>
              <p className="text-green-300 text-sm mt-1">
                You have approved {formatAmount(result.amount)} WAT for {result.employeeName}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          {result.isFullyApproved ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <div className="flex-1">
                  <p className="text-green-300 font-semibold">✨ Fully Approved - Ready for Execution!</p>
                  <p className="text-green-400/80 text-sm mt-1">
                    All required signatures collected. The scheduled mint will execute automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <div className="flex-1">
                  <p className="text-yellow-300 font-semibold">⏳ Awaiting Additional Signatures</p>
                  <p className="text-yellow-400/80 text-sm mt-1">
                    {result.remainingSignatures} more signature{result.remainingSignatures !== 1 ? 's' : ''} required before execution
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Request ID */}
          <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
              </svg>
              <span className="text-sm font-medium text-gray-400">Request ID</span>
            </div>
            <p className="text-white font-mono text-sm">{result.requestId}</p>
          </div>

          {/* Schedule ID */}
          <div className="bg-background-light/10 border border-purple-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">Scheduled Mint Transaction</span>
              </div>
              <a
                href={getHashScanUrl('schedule', result.scheduleId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Schedule ID:</span>
              <p className="text-white font-mono text-sm flex-1">{result.scheduleId}</p>
            </div>
          </div>

          {/* Signature Transaction ID */}
          <div className="bg-background-light/10 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">Your Signature Transaction</span>
              </div>
              <a
                href={getHashScanUrl('transaction', result.transactionId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Transaction ID:</span>
              <p className="text-white font-mono text-sm flex-1 break-all">{result.transactionId}</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-medium mb-1">Your Approval is Recorded</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Your signature has been added to the scheduled transaction</li>
                  {result.isFullyApproved ? (
                    <>
                      <li>• The mint will execute automatically now that all signatures are collected</li>
                      <li>• Tokens will be transferred to the employee&apos;s wallet</li>
                    </>
                  ) : (
                    <>
                      <li>• Other deciders will be notified to add their signatures</li>
                      <li>• The transaction will execute once all signatures are collected</li>
                    </>
                  )}
                  <li>• You can verify your signature on HashScan using the links above</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-background-light/5 border border-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Quick Links</p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={getHashScanUrl('schedule', result.scheduleId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-300 hover:text-purple-200 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                View Schedule
              </a>
              <a
                href={getHashScanUrl('transaction', result.transactionId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-lg text-blue-300 hover:text-blue-200 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                </svg>
                View Signature
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 bg-background-light/5">
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
