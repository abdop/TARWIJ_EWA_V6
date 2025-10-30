/**
 * Decider Approval List Component
 * Shows pending wage advance requests for deciders to approve/reject
 * Note: Simplified version - wallet signing to be implemented
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import DeciderApprovalSuccessModal from './DeciderApprovalSuccessModal';

interface WageAdvanceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  requestedAmount: number;
  status: string;
  scheduledTransactionId: string;
  createdAt: string;
  deciderApprovals?: Array<{
    deciderId: string;
    approved: boolean;
    timestamp: string;
  }>;
}

interface ApprovalResult {
  requestId: string;
  scheduleId: string;
  transactionId: string;
  employeeName: string;
  amount: number;
  isFullyApproved: boolean;
  remainingSignatures: number;
}

export default function DeciderApprovalList() {
  const { user, accountId } = useSelector((state: RootState) => state.hashconnect);
  const [requests, setRequests] = useState<WageAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  useEffect(() => {
    if (user && user.category === 'decider') {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wage-advance/pending-requests?deciderId=${user!.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending requests');
      }

      setRequests(data.requests);
    } catch (err: any) {
      console.error('Error fetching pending requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, approved: boolean, rejectionReason?: string) => {
    setError('');
    setProcessingId(requestId);

    try {
      if (!user || !accountId) {
        throw new Error('Please connect your wallet first');
      }

      // Step 1: Prepare the transaction (ScheduleSign or ScheduleDelete)
      console.log(`Preparing ${approved ? 'approval' : 'rejection'} transaction...`);
      const prepareResponse = await fetch('/api/wage-advance/prepare-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          deciderId: user.id,
          approved,
          rejectionReason,
        }),
      });

      const prepareData = await prepareResponse.json();
      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || 'Failed to prepare transaction');
      }

      // Step 2: Sign the transaction with HashConnect wallet (only for approval)
      let signatureTransactionId = '';
      if (prepareData.requiresWalletSignature !== false) {
        console.log('Requesting wallet signature...');
        const { executeTransaction } = await import('../services/hashconnect');
        const { Transaction } = await import('@hashgraph/sdk');

        // Decode transaction bytes from base64
        const transactionBytes = Uint8Array.from(
          Buffer.from(prepareData.transactionBytes, 'base64')
        );

        // Deserialize the transaction
        const transaction = Transaction.fromBytes(transactionBytes);

        // Sign and execute with wallet
        const result = await executeTransaction(accountId, transaction);
        console.log('Transaction signed and executed:', result);
        
        // Capture transaction ID from the transaction itself
        if (transaction.transactionId) {
          signatureTransactionId = transaction.transactionId.toString();
        }

        // Wait a moment for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Rejection doesn't require wallet signature
        console.log('Rejection will be executed by backend (no wallet signature needed)');
      }

      // Step 3: Update backend with the decision result
      console.log('Updating backend with decision result...');
      const submitResponse = await fetch('/api/wage-advance/submit-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          deciderId: user.id,
          approved,
          rejectionReason,
          transactionId: signatureTransactionId,
        }),
      });

      const submitData = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(submitData.error || 'Failed to update decision');
      }

      console.log(`Decision ${approved ? 'approved' : 'rejected'} successfully`);

      // Show success modal for approvals
      if (approved && submitData.transactionId) {
        const request = requests.find(r => r.id === requestId);
        setApprovalResult({
          requestId,
          scheduleId: submitData.scheduleId || request?.scheduledTransactionId || '0.0.0',
          transactionId: submitData.transactionId,
          employeeName: request?.employeeName || 'Employee',
          amount: request?.requestedAmount || 0,
          isFullyApproved: submitData.isFullyApproved || false,
          remainingSignatures: submitData.remainingSignatures || 0,
        });
      } else {
        // For rejections, just show alert
        alert(`Request ${approved ? 'approved' : 'rejected'} successfully!`);
        // Refresh the list
        await fetchPendingRequests();
      }
    } catch (err: any) {
      console.error('Error processing decision:', err);
      setError(err.message || 'Failed to process decision');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (requestId: string) => {
    handleDecision(requestId, true);
  };

  const handleReject = (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      handleDecision(requestId, false, reason);
    }
  };

  const handleCloseSuccess = async () => {
    setApprovalResult(null);
    // Refresh the list after closing success modal
    await fetchPendingRequests();
  };

  // Show success modal if approval completed
  if (approvalResult) {
    return <DeciderApprovalSuccessModal result={approvalResult} onClose={handleCloseSuccess} />;
  }

  if (loading) {
    return (
      <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
        <p className="text-gray-400">Loading pending requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Pending Approvals</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-gray-400 text-sm">No pending requests at this time.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-700 rounded-lg p-4 bg-background-dark/60"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{request.employeeName}</p>
                  <p className="text-xs text-gray-500">Request ID: {request.id}</p>
                  <p className="text-xs text-gray-500">{request.employeeEmail}</p>
                </div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  {(request.requestedAmount / 100).toFixed(2)} WAT
                </span>
              </div>

              <div className="mb-3 text-xs text-gray-400">
                <p>Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                <p>Schedule ID: {request.scheduledTransactionId}</p>
                <p>
                  Approvals: {request.deciderApprovals?.length || 0}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                  className="flex-1 bg-primary text-background-dark font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {processingId === request.id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingId === request.id}
                  className="flex-1 border border-red-500 text-red-500 font-semibold py-2 px-4 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
