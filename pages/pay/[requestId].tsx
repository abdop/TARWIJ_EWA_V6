import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountId, TokenId, TransactionId, TransferTransaction, Transaction } from '@hashgraph/sdk';

import { RootState } from '../../src/store';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

interface PaymentRequest {
  id: string;
  shopAccountId: string;
  shopName: string;
  shopId: string;
  amount: number;
  memo: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const { requestId } = router.query;
  const { accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!requestId || typeof requestId !== 'string') return;

    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/shop/payment-request?requestId=${requestId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load payment request');
        }

        setPaymentRequest(data.paymentRequest);
      } catch (err: any) {
        setError(err.message || 'Failed to load payment request');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const decodeTransactionBytes = useCallback((base64: string) => {
    if (typeof window !== 'undefined' && window.atob) {
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    const buffer = Buffer.from(base64, 'base64');
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!accountId || !paymentRequest) return;

    setIsPaying(true);
    setError(null);

    try {
      const response = await fetch('/api/shop/accept-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeAccountId: accountId,
          shopAccountId: paymentRequest.shopAccountId,
          amount: paymentRequest.amount,
          memo: paymentRequest.memo,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare payment');
      }

      const { transactionBytes } = data;
      if (!transactionBytes) {
        throw new Error('Transaction bytes missing from response');
      }

      const bytes = decodeTransactionBytes(transactionBytes);
      const transaction = Transaction.fromBytes(bytes);

      const { executeTransaction } = await import('../../src/services/hashconnect');
      const result = await executeTransaction(accountId, transaction);
      
      const transactionId = (result as any)?.transactionId?.toString?.();
      
      // Update the DLT operation with transaction ID
      if (transactionId && data.operationId) {
        try {
          await fetch('/api/shop/accept-token', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operationId: data.operationId,
              transactionId,
              status: 'PENDING_CONFIRMATION',
              message: 'Payment submitted, awaiting confirmation',
            }),
          });
        } catch (patchError) {
          console.error('Failed to update operation:', patchError);
        }
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        router.push('/employee');
      }, 3000);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  }, [accountId, paymentRequest, decodeTransactionBytes, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-dark via-background-dark to-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-400">Loading payment request...</p>
        </div>
      </div>
    );
  }

  if (error && !paymentRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-dark via-background-dark to-background-light flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-background-light/10 border border-red-500/40 rounded-xl p-6 text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Payment Request Not Found</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-background-dark rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = paymentRequest && new Date(paymentRequest.expiresAt) < new Date();

  return (
    <>
      <Head>
        <title>Pay {paymentRequest?.shopName} | TARWIJ EWA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background-dark via-background-dark to-background-light">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Payment Request</h1>
              <p className="text-gray-400">Complete your purchase with {paymentRequest?.shopName}</p>
            </div>

            {paymentSuccess ? (
              <div className="bg-background-light/10 border border-green-500/40 rounded-xl p-8 text-center">
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-gray-400 mb-4">Your payment has been processed.</p>
                <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                  <div>
                    <p className="text-sm text-gray-400">Merchant</p>
                    <p className="text-xl font-bold text-white">{paymentRequest?.shopName}</p>
                    <p className="text-xs text-gray-500 font-mono">{paymentRequest?.shopAccountId}</p>
                  </div>
                  {isExpired && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-xs font-semibold">
                      EXPIRED
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-2xl font-bold text-white">
                      {paymentRequest ? (paymentRequest.amount / 100).toFixed(2) : '0.00'} tokens
                    </span>
                  </div>

                  {paymentRequest?.memo && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400">Description</span>
                      <span className="text-white text-right">{paymentRequest.memo}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">
                      {paymentRequest ? new Date(paymentRequest.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Expires</span>
                    <span className="text-gray-300">
                      {paymentRequest ? new Date(paymentRequest.expiresAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                  {!isConnected ? (
                    <div className="text-center space-y-4">
                      <p className="text-gray-400 text-sm">Connect your wallet to complete payment</p>
                      <HashConnectButton />
                    </div>
                  ) : isExpired ? (
                    <div className="text-center">
                      <p className="text-red-400 mb-4">This payment request has expired</p>
                      <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                      >
                        Go Home
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-background-dark/60 border border-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Your Wallet</p>
                        <p className="text-white font-mono text-sm break-all">{accountId}</p>
                      </div>
                      <button
                        onClick={handlePayment}
                        disabled={isPaying}
                        className="w-full py-3 bg-primary text-background-dark rounded-lg font-bold text-lg hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isPaying ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-background-dark border-t-transparent" />
                            Processing Payment...
                          </span>
                        ) : (
                          `Pay ${paymentRequest ? (paymentRequest.amount / 100).toFixed(2) : '0.00'} Tokens`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
