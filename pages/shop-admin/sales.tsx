import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Transaction } from '@hashgraph/sdk';
import QRCode from 'qrcode';

import { RootState } from '../../src/store';

const HashConnectButton = dynamic(
  () => import('../../src/components/HashConnectButton'),
  { ssr: false }
);

interface EcosystemToken {
  tokenId: string;
  symbol: string;
  name: string;
  decimals: number;
  type: 'enterprise' | 'platform';
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  isAssociated?: boolean;
}

interface Sale {
  id: string;
  tokenId: string;
  tokenSymbol: string;
  employeeAccountId: string;
  amount: number;
  formattedAmount: string;
  memo: string;
  transactionId: string | null;
  status: string;
  createdAt: string;
}

export default function SalesPage() {
  const router = useRouter();
  const { user, accountId, isConnected } = useSelector((state: RootState) => state.hashconnect);

  const [catalogTokens, setCatalogTokens] = useState<EcosystemToken[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [selectedToken, setSelectedToken] = useState<EcosystemToken | null>(null);
  const [employeeAccount, setEmployeeAccount] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    if (isConnected === false) {
      router.push('/');
      return;
    }

    if (isConnected && user && user.category !== 'shop_admin' && user.category !== 'cashier') {
      router.push('/');
    }
  }, [isConnected, router, user]);

  const loadTokenCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const query = accountId ? `?shopAccountId=${encodeURIComponent(accountId)}` : '';
      const response = await fetch(`/api/shop/tokens${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load token catalog');
      }

      const associated = (data.tokens || []).filter((t: EcosystemToken) => t.isAssociated);
      setCatalogTokens(associated);
      if (associated.length > 0 && !selectedToken) {
        setSelectedToken(associated[0]);
      }
    } catch (error: any) {
      console.error('Failed to load token catalog:', error);
    } finally {
      setCatalogLoading(false);
    }
  }, [accountId, selectedToken]);

  useEffect(() => {
    if (accountId) {
      loadTokenCatalog();
    }
  }, [accountId, loadTokenCatalog]);

  const loadSales = useCallback(async () => {
    if (!accountId) return;
    setSalesLoading(true);
    try {
      const response = await fetch(`/api/shop/accept-token?shopAccountId=${encodeURIComponent(accountId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sales');
      }

      const acceptanceOps = (data.operations || []).filter(
        (op: any) => op.type?.startsWith('SHOP_ACCEPT_TOKEN')
      );

      const salesData: Sale[] = acceptanceOps.map((op: any) => {
        const decimals = op.details?.decimals ?? 2;
        const divisor = Math.pow(10, decimals);
        const rawAmount = op.details?.amount ?? 0;
        const formattedAmount = (rawAmount / divisor).toFixed(2);
        const tokenIdFromOp = op.tokenId || op.details?.tokenId;
        const catalogToken = catalogTokens.find((t) => t.tokenId === tokenIdFromOp);

        return {
          id: op.id,
          tokenId: tokenIdFromOp || '',
          tokenSymbol: catalogToken?.symbol || 'TOKEN',
          employeeAccountId: op.details?.employeeAccountId || '—',
          amount: rawAmount,
          formattedAmount,
          memo: op.details?.memo || '',
          transactionId: op.transactionId || null,
          status: op.status || 'UNKNOWN',
          createdAt: op.createdAt,
        };
      });

      setSales(salesData);
    } catch (error: any) {
      console.error('Failed to load sales:', error);
    } finally {
      setSalesLoading(false);
    }
  }, [accountId, catalogTokens]);

  useEffect(() => {
    if (accountId && catalogTokens.length > 0) {
      loadSales();
    }
  }, [accountId, catalogTokens, loadSales]);

  const amountInTinyUnits = useMemo(() => {
    if (!amountInput || !selectedToken) return null;
    const parsed = Number(amountInput);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    const multiplier = Math.pow(10, selectedToken.decimals ?? 2);
    return Math.round(parsed * multiplier);
  }, [amountInput, selectedToken]);

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

  const handleGenerateQR = useCallback(async () => {
    if (!accountId) {
      setSubmissionError('Connect your wallet before generating payment request.');
      return;
    }
    if (!selectedToken) {
      setSubmissionError('Select a token.');
      return;
    }
    if (!amountInTinyUnits || amountInTinyUnits <= 0) {
      setSubmissionError('Enter a valid amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(null);
    setQrCodeUrl(null);
    setPaymentUrl(null);

    try {
      const response = await fetch('/api/shop/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopAccountId: accountId,
          amount: amountInTinyUnits,
          memo: memoInput.trim() || `Purchase at ${new Date().toLocaleString()}`,
          tokenId: selectedToken.tokenId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment request');
      }

      const { paymentUrl: url } = data;
      setPaymentUrl(url);

      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#ffffff',
            light: '#1a1a2e',
          },
        });
        setQrCodeUrl(qrCanvasRef.current.toDataURL());
      }

      setSubmissionSuccess('Payment request created! Show QR code to customer.');
    } catch (error: any) {
      console.error('QR generation failed:', error);
      setSubmissionError(error.message || 'Failed to generate payment request');
    } finally {
      setIsSubmitting(false);
    }
  }, [accountId, selectedToken, amountInTinyUnits, memoInput]);

  return (
    <>
      <Head>
        <title>Sales - Shop Admin | TARWIJ EWA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background-dark via-background-dark to-background-light">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-screen bg-background-light/10 border-r border-gray-700">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-white mb-8">Shop Admin</h1>
              <nav className="space-y-2">
                <button
                  onClick={() => router.push('/shop-admin')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-background-light/20 rounded-lg transition"
                >
                  <DashboardIcon className="h-5 w-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/shop-admin/sales')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-white bg-primary rounded-lg"
                >
                  <ShopIcon className="h-5 w-5" />
                  Sales
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Sales</h2>
                  <p className="text-gray-400 mt-1">Record token payments from employees</p>
                </div>
                <HashConnectButton />
              </div>

              <div className="space-y-6">
                {/* Welcome Card */}
                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                      <p className="text-sm text-gray-400">Account ID</p>
                      <p className="text-xl font-bold text-white mt-2 break-all">{accountId || '—'}</p>
                    </div>
                    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                      <p className="text-sm text-gray-400">Role</p>
                      <p className="text-xl font-bold text-primary mt-2 capitalize">
                        {user?.category?.replace('_', ' ') || '—'}
                      </p>
                    </div>
                    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                      <p className="text-sm text-gray-400">Total Sales</p>
                      <p className="text-2xl font-bold text-white mt-2">{sales.length}</p>
                    </div>
                  </div>
                </section>

                {/* Record Sale Form */}
                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6 space-y-6">
                  <header>
                    <h3 className="text-xl font-semibold text-white">Create Payment Request</h3>
                    <p className="text-sm text-gray-400">Generate a QR code for customers to scan and pay</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Token</label>
                      <select
                        value={selectedToken?.tokenId || ''}
                        onChange={(e) => {
                          const token = catalogTokens.find((t) => t.tokenId === e.target.value);
                          setSelectedToken(token || null);
                        }}
                        disabled={catalogLoading || catalogTokens.length === 0 || !!qrCodeUrl}
                        className="w-full rounded-lg bg-background-dark/60 border border-gray-700 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
                      >
                        {catalogTokens.length === 0 ? (
                          <option>No tokens available</option>
                        ) : (
                          catalogTokens.map((token) => (
                            <option key={token.tokenId} value={token.tokenId}>
                              {token.symbol} - {token.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Amount ({selectedToken?.symbol ?? 'tokens'})</label>
                      <input
                        value={amountInput}
                        onChange={(event) => setAmountInput(event.target.value)}
                        placeholder="e.g. 25.50"
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={!!qrCodeUrl}
                        className="w-full rounded-lg bg-background-dark/60 border border-gray-700 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                      {amountInTinyUnits && selectedToken && (
                        <p className="text-xs text-gray-500">
                          {amountInTinyUnits.toLocaleString()} units @ 10^{selectedToken.decimals}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Memo (optional)</label>
                      <input
                        value={memoInput}
                        onChange={(event) => setMemoInput(event.target.value)}
                        placeholder="Purchase description"
                        maxLength={100}
                        disabled={!!qrCodeUrl}
                        className="w-full rounded-lg bg-background-dark/60 border border-gray-700 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {submissionError && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {submissionError}
                    </div>
                  )}

                  {submissionSuccess && (
                    <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                      {submissionSuccess}
                    </div>
                  )}

                  {qrCodeUrl && paymentUrl && (
                    <div className="bg-background-dark/60 border border-primary/40 rounded-xl p-6 text-center space-y-4">
                      <h4 className="text-lg font-semibold text-white">Payment QR Code</h4>
                      <p className="text-sm text-gray-400">Customer scans this code to complete payment</p>
                      <div className="flex justify-center">
                        <canvas ref={qrCanvasRef} className="hidden" />
                        <img src={qrCodeUrl} alt="Payment QR Code" className="rounded-lg border-4 border-white" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 break-all font-mono">{paymentUrl}</p>
                        <button
                          onClick={() => {
                            setQrCodeUrl(null);
                            setPaymentUrl(null);
                            setAmountInput('');
                            setMemoInput('');
                          }}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          Create New Request
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {qrCodeUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setQrCodeUrl(null);
                          setPaymentUrl(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateQR}
                      disabled={isSubmitting || !isConnected || !selectedToken || !!qrCodeUrl}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-background-dark transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-background-dark border-t-transparent" />
                          Generating…
                        </>
                      ) : (
                        '🔲 Generate Payment QR'
                      )}
                    </button>
                  </div>
                </section>

                {/* Hidden canvas for QR generation */}
                <canvas ref={qrCanvasRef} className="hidden" />

                {/* Sales History */}
                <section className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Recent Sales</h3>
                    <button
                      type="button"
                      onClick={loadSales}
                      disabled={salesLoading}
                      className="text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {salesLoading && sales.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-700/60 bg-background-dark/60 p-4 text-sm text-gray-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading sales…
                    </div>
                  ) : sales.length === 0 ? (
                    <p className="text-sm text-gray-500">No sales recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-background-dark/60 border-b border-gray-700">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Token</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">Memo</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map((sale) => {
                            let statusStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                            if (sale.status?.toUpperCase().includes('SUCCESS')) {
                              statusStyle = 'bg-green-500/20 text-green-300 border border-green-500/40';
                            } else if (sale.status?.toUpperCase().includes('FAIL') || sale.status?.toUpperCase().includes('ERROR')) {
                              statusStyle = 'bg-red-500/20 text-red-300 border border-red-500/40';
                            }

                            return (
                              <tr key={sale.id} className="border-b border-gray-700/50 hover:bg-background-dark/40">
                                <td className="px-4 py-3 text-gray-200">
                                  {new Date(sale.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-white font-semibold">{sale.tokenSymbol}</td>
                                <td className="px-4 py-3 text-white font-semibold">{sale.formattedAmount}</td>
                                <td className="px-4 py-3 text-gray-200 font-mono text-xs">{sale.employeeAccountId}</td>
                                <td className="px-4 py-3 text-gray-200">{sale.memo || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                    {sale.status.toLowerCase().replace(/_/g, ' ')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z" /></svg>;
}

function ShopIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" /></svg>;
}
