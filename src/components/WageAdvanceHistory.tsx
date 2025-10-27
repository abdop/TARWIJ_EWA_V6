/**
 * Wage Advance History Component
 * Shows completed and rejected wage advance requests
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface WageAdvanceHistoryItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  requestedAmount: number;
  status: string;
  scheduledTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deciderApprovals?: Array<{
    deciderId: string;
    approved: boolean;
    timestamp: string;
  }>;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
}

export default function WageAdvanceHistory() {
  const { user } = useSelector((state: RootState) => state.hashconnect);
  const [requests, setRequests] = useState<WageAdvanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (user && user.entrepriseId) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      if (!user?.entrepriseId) {
        throw new Error('User enterprise ID not found');
      }

      console.log('Fetching history for enterprise:', user.entrepriseId);
      const response = await fetch(`/api/wage-advance/history?entrepriseId=${user.entrepriseId}`);
      const data = await response.json();

      console.log('History API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/40';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/40';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/40';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filter === 'all') return true;
    if (filter === 'approved') return request.status === 'approved' || request.status === 'completed';
    if (filter === 'rejected') return request.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
        <p className="text-gray-400">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light/10 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Wage Advance History</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-primary text-background-dark'
                : 'bg-background-dark text-gray-400 hover:bg-background-dark/60'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-background-dark text-gray-400 hover:bg-background-dark/60'
            }`}
          >
            Approved ({requests.filter(r => r.status === 'approved' || r.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-background-dark text-gray-400 hover:bg-background-dark/60'
            }`}
          >
            Rejected ({requests.filter(r => r.status === 'rejected').length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <p className="text-gray-400 text-sm">No history records found.</p>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-700 rounded-lg p-4 bg-background-dark/60"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-semibold">{request.employeeName}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Request ID: {request.id}</p>
                  <p className="text-xs text-gray-500">{request.employeeEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-primary font-bold text-lg">
                    {(request.requestedAmount / 100).toFixed(2)} WAT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-xs text-gray-400">
                <div>
                  <p className="text-gray-500">Submitted:</p>
                  <p className="text-gray-300">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">
                    {request.status === 'rejected' ? 'Rejected:' : 'Completed:'}
                  </p>
                  <p className="text-gray-300">
                    {new Date(request.completedAt || request.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {request.scheduledTransactionId && (
                <div className="mb-3 text-xs">
                  <p className="text-gray-500">Schedule ID:</p>
                  <p className="text-gray-300 font-mono">{request.scheduledTransactionId}</p>
                </div>
              )}

              {request.status === 'rejected' && request.rejectionReason && (
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-300">{request.rejectionReason}</p>
                  {request.rejectedByName && (
                    <p className="text-xs text-gray-500 mt-2">
                      Rejected by: <span className="text-gray-300">{request.rejectedByName}</span>
                    </p>
                  )}
                </div>
              )}

              {(request.status === 'approved' || request.status === 'completed') && request.deciderApprovals && request.deciderApprovals.length > 0 && (
                <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Approvals:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.deciderApprovals.map((approval, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded"
                      >
                        ✓ Decider {index + 1}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
