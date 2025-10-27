/**
 * Wage Advance Request Component (Employee)
 * Allows employees to request wage advances with HashConnect signing
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface WageAdvanceRequestProps {
  onSuccess?: () => void;
}

export default function WageAdvanceRequest({ onSuccess }: WageAdvanceRequestProps) {
  const { user, accountId } = useSelector((state: RootState) => state.hashconnect);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'input' | 'associating' | 'creating' | 'done'>('input');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user || !accountId) {
        throw new Error('Please connect your wallet first');
      }

      const requestedAmount = Math.round(parseFloat(amount) * 100); // Convert to cents

      if (requestedAmount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Step 1: Create wage advance request
      setStep('creating');
      const requestResponse = await fetch('/api/wage-advance/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          requestedAmount,
        }),
      });

      const requestData = await requestResponse.json();
      if (!requestResponse.ok) {
        throw new Error(requestData.error || 'Failed to create request');
      }

      const requestId = requestData.request.id;

      // Step 2: Check if token association is needed
      setStep('associating');
      const associateResponse = await fetch('/api/wage-advance/associate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          employeeAccountId: accountId,
        }),
      });

      const associateData = await associateResponse.json();
      if (!associateResponse.ok) {
        throw new Error(associateData.error || 'Failed to check token association');
      }

      // If association is needed, sign with wallet
      if (associateData.needsAssociation) {
        console.log('Token association needed - requesting wallet signature');
        
        try {
          // Import HashConnect functions
          const { signTransaction, executeTransaction } = await import('../services/hashconnect');
          const { Transaction } = await import('@hashgraph/sdk');
          
          // Decode transaction bytes from base64
          const transactionBytes = Uint8Array.from(
            Buffer.from(associateData.transactionBytes, 'base64')
          );
          
          // Deserialize the transaction
          const transaction = Transaction.fromBytes(transactionBytes);
          
          // Sign and execute the transaction with HashConnect
          console.log('Requesting wallet signature for token association...');
          const result = await executeTransaction(accountId, transaction);
          
          console.log('Token association transaction executed:', result);
          
          // Wait a moment for the transaction to be processed
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error: any) {
          console.error('Token association failed:', error);
          throw new Error(`Failed to associate token: ${error.message}`);
        }
      }

      // Step 3: Create scheduled mint transaction (backend)
      const scheduleResponse = await fetch('/api/wage-advance/create-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const scheduleData = await scheduleResponse.json();
      if (!scheduleResponse.ok) {
        throw new Error(scheduleData.error || 'Failed to create scheduled transaction');
      }

      setStep('done');
      setSuccess(`Wage advance request submitted successfully! Request ID: ${requestId}`);
      setAmount('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error requesting wage advance:', err);
      setError(err.message || 'Failed to request wage advance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Request Wage Advance</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/40 rounded-lg text-primary text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
            Amount (WAT)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-background-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
            placeholder="Enter amount"
          />
        </div>

        {step !== 'input' && (
          <div className="text-sm text-gray-400">
            {step === 'creating' && '⏳ Creating request...'}
            {step === 'associating' && (
              <div className="space-y-1">
                <div>⏳ Checking token association...</div>
                <div className="text-xs text-yellow-400">
                  Please check your wallet if signature is required
                </div>
              </div>
            )}
            {step === 'done' && '✓ Request submitted!'}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !user}
          className="w-full bg-primary text-background-dark font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit Request'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>• You will be asked to sign transactions with your wallet</p>
        <p>• Token association may be required (one-time)</p>
        <p>• Deciders will be notified to approve your request</p>
      </div>
    </div>
  );
}
