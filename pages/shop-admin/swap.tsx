import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ContractExecuteTransaction, ContractFunctionParameters } from '@hashgraph/sdk';

import { RootState } from '../../src/store';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

interface EnterpriseToken {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  swapContractId: string;
  enterpriseId: string;
  enterpriseName: string;
}

interface SwapResult {
  transactionId: string;
  tokenSymbol: string;
  amount: number;
  timestamp: string;
}

export default function SwapPage() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const [tokens, setTokens] = useState<EnterpriseToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swappingTokenId, setSwappingTokenId] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (isConnected === false) {
      router.push('/');
      return;
    }

    if (isConnected && user && user.category !== 'shop_admin' && user.category !== 'cashier') {
      router.push('/');
    }
  }, [isConnected, router, user]);

  const loadTokensWithBalance = useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shop/token-balances?shopAccountId=${accountId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load token balances');
      }

      // Filter only enterprise tokens with balance > 0
      const enterpriseTokensWithBalance = data.balances
        .filter((token: any) => token.type === 'enterprise' && token.balance > 0)
        .map((token: any) => ({
          tokenId: token.tokenId,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: token.balance,
          swapContractId: token.swapContractId,
          enterpriseId: token.enterpriseId,
          enterpriseName: token.enterpriseName,
        }));

      setTokens(enterpriseTokensWithBalance);
    } catch (err: any) {
      console.error('Failed to load token balances:', err);
      setError(err.message || 'Failed to load token balances');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (isConnected && accountId) {
      loadTokensWithBalance();
    }
  }, [isConnected, accountId, loadTokensWithBalance]);

  const handleSwap = async (token: EnterpriseToken) => {
    if (!accountId) {
      setError('Please connect your wallet');
      return;
    }

    if (!token.swapContractId) {
      setError(`Swap contract not configured for ${token.symbol}`);
      return;
    }

    setSwappingTokenId(token.tokenId);
    setError(null);

    try {
      // Create contract execute transaction
      const { executeTransaction } = await import('../../src/services/hashconnect');
      const { Transaction } = await import('@hashgraph/sdk');

      // Prepare contract call transaction
      const prepareResponse = await fetch('/api/shop/prepare-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopAccountId: accountId,
          tokenId: token.tokenId,
          amount: token.balance,
          swapContractId: token.swapContractId,
        }),
      });

      const prepareData = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || 'Failed to prepare swap transaction');
      }

      // Decode and execute transaction
      const transactionBytes = Uint8Array.from(
        Buffer.from(prepareData.transactionBytes, 'base64')
      );
      const transaction = Transaction.fromBytes(transactionBytes);

      console.log('Executing swap transaction...');
      const result = await executeTransaction(accountId, transaction);
      console.log('Swap result:', result);

      const transactionId = (result as any)?.transactionId?.toString?.();

      if (!transactionId) {
        console.error('No transaction ID in result:', result);
        throw new Error('Wallet signature cancelled or no transaction ID returned');
      }

      console.log('Swap transaction ID:', transactionId);

      // Set success result
      setSwapResult({
        transactionId,
        tokenSymbol: token.symbol,
        amount: token.balance / Math.pow(10, token.decimals),
        timestamp: new Date().toISOString(),
      });
      setShowSuccessModal(true);

      // Reload balances after successful swap
      setTimeout(() => {
        loadTokensWithBalance();
      }, 3000);
    } catch (err: any) {
      console.error('Swap failed:', err);
      setError(err.message || 'Failed to execute swap');
    } finally {
      setSwappingTokenId(null);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSwapResult(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Head>
          <title>Token Swap | TARWIJ EWA</title>
        </Head>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                Connect Your Wallet
              </h3>
              <p className="text-gray-400 mb-6">
                Please connect your HashPack wallet to access the token swap feature.
              </p>
              <HashConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Head>
        <title>Token Swap | TARWIJ EWA</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Token Swap</h1>
              <p className="text-gray-400">
                Swap your enterprise tokens for platform stablecoins
              </p>
            </div>
            <button
              onClick={() => router.push('/shop-admin')}
              className="px-4 py-2 bg-background-light/20 border border-gray-700 rounded-lg text-gray-300 hover:bg-background-light/30 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Connected Account</p>
              <p className="text-lg font-semibold text-white">{accountId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Shop Admin</p>
              <p className="text-lg font-semibold text-white">{user?.name || 'Unknown'}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tokens List */}
        <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Enterprise Tokens Available for Swap
            </h2>
            <button
              onClick={loadTokensWithBalance}
              disabled={loading}
              className="px-4 py-2 bg-primary/20 border border-primary rounded-lg text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && tokens.length === 0 ? (
            <div className="text-center py-12">
              <LoadingSpinner />
              <p className="text-gray-400 mt-4">Loading tokens...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No enterprise tokens available for swap</p>
              <p className="text-gray-500 text-sm">
                You need to have enterprise tokens with a positive balance to swap them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div
                  key={token.tokenId}
                  className="bg-background-dark border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{token.symbol}</h3>
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                          Enterprise
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{token.name}</p>
                      <p className="text-xs text-gray-500 mb-2">Token ID: {token.tokenId}</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Balance</p>
                          <p className="text-lg font-semibold text-white">
                            {(token.balance / Math.pow(10, token.decimals)).toFixed(2)} {token.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Enterprise</p>
                          <p className="text-sm text-gray-300">{token.enterpriseName}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSwap(token)}
                      disabled={swappingTokenId === token.tokenId}
                      className="px-6 py-3 bg-primary rounded-lg text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {swappingTokenId === token.tokenId ? (
                        <>
                          <LoadingSpinner />
                          <span>Swapping...</span>
                        </>
                      ) : (
                        <>
                          <SwapIcon className="w-5 h-5" />
                          <span>Swap</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
          <div className="flex gap-3">
            <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-400 font-semibold mb-1">How Token Swap Works</p>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Your enterprise tokens will be burned (wiped) from your account</li>
                <li>• You will receive an equal amount of platform stablecoins</li>
                <li>• The swap is executed through a smart contract on Hedera</li>
                <li>• Transaction requires your wallet signature to proceed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && swapResult && (
        <SwapSuccessModal
          transactionId={swapResult.transactionId}
          tokenSymbol={swapResult.tokenSymbol}
          amount={swapResult.amount}
          onClose={closeSuccessModal}
        />
      )}
    </div>
  );
}

interface SwapSuccessModalProps {
  transactionId: string;
  tokenSymbol: string;
  amount: number;
  onClose: () => void;
}

function SwapSuccessModal({ transactionId, tokenSymbol, amount, onClose }: SwapSuccessModalProps) {
  const hashscanUrl = `https://hashscan.io/testnet/transaction/${transactionId}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Swap Successful!</h2>
                <p className="text-sm text-gray-400">Transaction confirmed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Swapped Amount</p>
            <p className="text-2xl font-bold text-white">
              {amount.toFixed(2)} {tokenSymbol}
            </p>
          </div>

          <div className="bg-background-light/10 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">Transaction ID</p>
            <p className="text-xs text-gray-300 font-mono break-all">{transactionId}</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <div className="flex gap-2">
              <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-semibold mb-1">Swap Completed</p>
                <p className="text-sm text-green-300">
                  Your enterprise tokens have been swapped for platform stablecoins.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex gap-3">
          <a
            href={hashscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-primary rounded-lg text-white font-semibold hover:bg-primary/90 transition-colors text-center flex items-center justify-center gap-2"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            View on HashScan
          </a>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
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

function SwapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0-4h.01" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

function ExternalLinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
