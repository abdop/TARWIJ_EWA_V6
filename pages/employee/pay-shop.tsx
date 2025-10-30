import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Transaction } from '@hashgraph/sdk';
import { RootState } from '../../src/store';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

export default function PayShopPage() {
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const [shopAccountId, setShopAccountId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [memo, setMemo] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState<{
    transactionId: string;
    status: string;
    shopAccountId: string;
    amount: string;
    memo: string;
    timestamp: string;
    tokenSymbol: string;
  } | null>(null);

  const amountInTinyUnits = useMemo(() => {
    if (!amountInput) return null;
    const parsed = Number(amountInput);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    // 1 MAD = 100 tiny units (2 decimals)
    return Math.round(parsed * 100);
  }, [amountInput]);

  const decodeTransactionBytes = useCallback((base64: string) => {
    if (typeof window !== 'undefined' && window.atob) {
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    throw new Error('Base64 decoding not available');
  }, []);

  const handlePayment = useCallback(async () => {
    if (!accountId) {
      setError('Please connect your wallet first');
      return;
    }

    if (!shopAccountId.trim()) {
      setError('Please enter the shop account ID');
      return;
    }

    if (!amountInTinyUnits || amountInTinyUnits <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsPaying(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare the transaction
      const response = await fetch('/api/shop/accept-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeAccountId: accountId,
          shopAccountId: shopAccountId.trim(),
          amount: amountInTinyUnits,
          memo: memo.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare payment');
      }

      const { transactionBytes, operationId, transactionId: preparedTransactionId, tokenSymbol } = data;
      if (!transactionBytes) {
        throw new Error('Transaction bytes missing from response');
      }

      // Decode and execute transaction
      const bytes = decodeTransactionBytes(transactionBytes);
      const transaction = Transaction.fromBytes(bytes);

      const { executeTransaction } = await import('../../src/services/hashconnect');
      const result = await executeTransaction(accountId, transaction);

      const executeResultId = (result as any)?.transactionId?.toString?.();
      const effectiveTransactionId = executeResultId || preparedTransactionId;

      // Update the DLT operation with transaction ID
      if (effectiveTransactionId && operationId) {
        try {
          await fetch('/api/shop/accept-token', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operationId,
              transactionId: effectiveTransactionId,
              status: 'PENDING_CONFIRMATION',
              message: 'Payment submitted, awaiting confirmation',
            }),
          });
        } catch (patchError) {
          console.error('Failed to update operation:', patchError);
        }
      }

      // Show transaction summary
      setTransactionSummary({
        transactionId: effectiveTransactionId || 'Unavailable',
        status: 'Awaiting confirmation',
        shopAccountId: shopAccountId.trim(),
        amount: amountInput,
        memo: memo.trim() || 'No memo',
        timestamp: new Date().toISOString(),
        tokenSymbol: tokenSymbol || 'Tokens',
      });

      setSuccess(true);
      setShopAccountId('');
      setAmountInput('');
      setMemo('');
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  }, [accountId, shopAccountId, amountInTinyUnits, memo, decodeTransactionBytes]);

  return (
    <>
      <Head>
        <title>Pay Shop • TARWIJ EWA</title>
      </Head>

      <div className="bg-background-dark min-h-screen text-gray-200">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-white">TARWIJ EWA</h1>
              <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
            </div>
            <nav className="space-y-2">
              <a href="/employee" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <DashboardIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/employee/request" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <RequestIcon className="w-5 h-5" />
                <span>Request Advance</span>
              </a>
              <a href="/employee/wallet" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-primary/10">
                <WalletIcon className="w-5 h-5" />
                <span>My Wallet</span>
              </a>
              <a href="/employee/pay-shop" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/30 text-primary font-semibold">
                <PayIcon className="w-5 h-5" />
                <span>Pay Shop</span>
              </a>
            </nav>
            <div className="mt-auto pt-8 text-xs text-gray-500">Connected via HashPack</div>
          </aside>

          <main className="flex-1 flex flex-col bg-background-dark/90 overflow-y-auto">
            <div className="border-b border-gray-800 bg-background-dark/60 px-10 py-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Pay Shop</h1>
                  <p className="text-gray-400 mt-1 text-sm">Make instant payments to partner shops using your wage advance tokens</p>
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
              <div className="max-w-2xl mx-auto">
                {!isConnected ? (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-8 text-center">
                    <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">Connect your HashPack wallet to make payments</p>
                    <HashConnectButton />
                  </div>
                ) : (
                  <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Payment Details</h3>
                      <p className="text-sm text-gray-400">Enter the shop's account ID and payment amount in Moroccan Dirham (MAD)</p>
                    </div>

                    {error && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                        Payment submitted successfully! The transaction is being confirmed on the network.
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Shop Account ID</label>
                        <input
                          type="text"
                          value={shopAccountId}
                          onChange={(e) => setShopAccountId(e.target.value)}
                          placeholder="0.0.123456"
                          className="w-full px-4 py-3 bg-background-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          disabled={isPaying}
                        />
                        <p className="text-xs text-gray-500">Enter the Hedera account ID of the shop</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Amount (MAD)</label>
                        <input
                          type="number"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          placeholder="25.50"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 bg-background-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          disabled={isPaying}
                        />
                        <p className="text-xs text-gray-500">1 MAD = 1 Token (backed one-to-one)</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Memo (Optional)</label>
                        <input
                          type="text"
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          placeholder="Purchase description"
                          maxLength={100}
                          className="w-full px-4 py-3 bg-background-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                          disabled={isPaying}
                        />
                        <p className="text-xs text-gray-500">Add a note about this payment (max 100 characters)</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShopAccountId('');
                          setAmountInput('');
                          setMemo('');
                          setError(null);
                        }}
                        className="flex-1 px-6 py-3 bg-background-dark border border-gray-700 text-white rounded-lg font-semibold hover:bg-background-light/10 transition disabled:opacity-50"
                        disabled={isPaying}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handlePayment}
                        disabled={isPaying || !shopAccountId.trim() || !amountInTinyUnits}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isPaying ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          'Pay Now'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Transaction Summary Modal */}
      {transactionSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background-dark border border-gray-700 rounded-xl max-w-lg w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-400 text-sm">Your transaction has been submitted to the network</p>
            </div>

            <div className="space-y-4 bg-background-light/10 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-start gap-6">
                <div>
                  <span className="text-gray-400 text-sm">Status</span>
                  <p className="text-white font-semibold text-sm mt-1">{transactionSummary.status}</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm">Transaction ID</span>
                  <p className="text-white font-mono text-sm break-all mt-1">{transactionSummary.transactionId}</p>
                  <a
                    href={`https://hashscan.io/testnet/transaction/${transactionSummary.transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline mt-1 inline-block"
                  >
                    View on HashScan →
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-700/50 pt-4">
                <div className="flex justify-between mb-3">
                  <span className="text-gray-400 text-sm">Shop Account</span>
                  <span className="text-white font-mono text-sm">{transactionSummary.shopAccountId}</span>
                </div>

                <div className="flex justify-between mb-3">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="text-white font-semibold text-lg">{transactionSummary.amount} {transactionSummary.tokenSymbol}</span>
                </div>

                <div className="flex justify-between mb-3">
                  <span className="text-gray-400 text-sm">Memo</span>
                  <span className="text-white text-sm">{transactionSummary.memo}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Timestamp</span>
                  <span className="text-white text-sm">{new Date(transactionSummary.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTransactionSummary(null)}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                Make Another Payment
              </button>
              <button
                onClick={() => {
                  setTransactionSummary(null);
                  window.location.href = '/employee/wallet';
                }}
                className="flex-1 px-6 py-3 bg-background-dark border border-gray-700 text-white rounded-lg font-semibold hover:bg-background-light/10 transition"
              >
                View Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" /></svg>;
}

function RequestIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>;
}

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>;
}

function PayIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>;
}
