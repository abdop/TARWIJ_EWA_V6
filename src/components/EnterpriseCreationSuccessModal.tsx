/**
 * Success Modal for Enterprise Creation
 * Shows token info, swap contract, and HashScan links
 */

interface CreationResult {
  enterpriseId: string;
  tokenId: string;
  swapContractId: string;
  transactionId: string;
  tokenName: string;
  tokenSymbol: string;
}

interface SuccessModalProps {
  result: CreationResult;
  onClose: () => void;
}

export default function EnterpriseCreationSuccessModal({ result, onClose }: SuccessModalProps) {
  const hashscanUrl = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet' 
    ? 'https://hashscan.io/mainnet' 
    : 'https://hashscan.io/testnet';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-xl max-w-2xl w-full shadow-2xl">
        {/* Success Header */}
        <div className="border-b border-gray-700 p-6 bg-green-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Enterprise Created Successfully!</h2>
              <p className="text-sm text-gray-400 mt-1">
                {result.tokenName} has been set up on Hedera
              </p>
            </div>
          </div>
        </div>

        {/* Success Content */}
        <div className="p-6 space-y-6">
          {/* Token Information */}
          <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
              </svg>
              Enterprise Token
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Token ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-primary font-mono">{result.tokenId}</code>
                  <a
                    href={`${hashscanUrl}/token/${result.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="View on HashScan"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white font-semibold">{result.tokenName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Symbol:</span>
                <span className="text-white font-semibold">{result.tokenSymbol}</span>
              </div>
            </div>
          </div>

          {/* Swap Contract Information */}
          <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/>
              </svg>
              Swap Smart Contract
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Contract ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-purple-400 font-mono">{result.swapContractId}</code>
                  <a
                    href={`${hashscanUrl}/contract/${result.swapContractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="View on HashScan"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Purpose:</span>
                <span className="text-white">Token ⇄ MADT Swap</span>
              </div>
            </div>
          </div>

          {/* Transaction Information */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <div className="flex-1">
                <p className="text-blue-400 text-sm font-semibold mb-1">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-300 font-mono break-all">{result.transactionId}</code>
                  <a
                    href={`${hashscanUrl}/transaction/${result.transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                    title="View on HashScan"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`${hashscanUrl}/token/${result.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                View Token
              </a>
              <a
                href={`${hashscanUrl}/contract/${result.swapContractId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/>
                </svg>
                View Contract
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
