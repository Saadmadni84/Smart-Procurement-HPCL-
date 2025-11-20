import React, { useState, useEffect } from 'react';
import { getApprovalsInbox, approvePR, rejectPR } from '../services/api';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    loadApprovals();
  }, [filter]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      // const data = await getApprovalsInbox();
      // setApprovals(data.filter(a => a.status === filter));
      // Mock data for now
      const mockData = [
        { prId: 'PR-2025-05-045', description: '10 HP Monitors', estimatedValue: 350000, status: 'PENDING', createdBy: 'Alice Brown', createdAt: '2025-11-22', priority: 'HIGH' },
        { prId: 'PR-2025-05-044', description: 'Office Chairs', estimatedValue: 125000, status: 'PENDING', createdBy: 'Charlie Wilson', createdAt: '2025-11-21', priority: 'MEDIUM' },
        { prId: 'PR-2025-05-043', description: 'Printer Supplies', estimatedValue: 45000, status: 'APPROVED', createdBy: 'Diana Prince', createdAt: '2025-11-20', priority: 'LOW' },
      ];
      setApprovals(mockData.filter(a => a.status === filter));
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (prId) => {
    try {
      await approvePR(prId, 'John Doe');
      alert(`PR ${prId} approved successfully!`);
      loadApprovals();
    } catch (error) {
      console.error('Error approving PR:', error);
      alert('Error approving PR. Please check backend connection.');
    }
  };

  const handleReject = async (prId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await rejectPR(prId, 'John Doe', reason);
      alert(`PR ${prId} rejected.`);
      loadApprovals();
    } catch (error) {
      console.error('Error rejecting PR:', error);
      alert('Error rejecting PR. Please check backend connection.');
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      HIGH: 'badge-danger',
      MEDIUM: 'badge-warning',
      LOW: 'badge-info',
    };
    return badges[priority] || 'badge-secondary';
  };

  return (
    <div>
      <h1>Approvals Inbox</h1>
      <p style={{ color: 'var(--medium-gray)', marginBottom: 'var(--space-xl)' }}>
        Review and approve purchase requests assigned to you.
      </p>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            className={`btn ${filter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('PENDING')}
          >
            ⏳ Pending ({approvals.filter(a => a.status === 'PENDING').length})
          </button>
          <button
            className={`btn ${filter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('APPROVED')}
          >
            ✅ Approved
          </button>
          <button
            className={`btn ${filter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('REJECTED')}
          >
            ❌ Rejected
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Approval Queue - {filter}</h3>
        {loading ? (
          <div className="spinner"></div>
        ) : approvals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--medium-gray)' }}>
            <p>No {filter.toLowerCase()} approvals found.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>PR ID</th>
                <th>Description</th>
                <th>Value (INR)</th>
                <th>Priority</th>
                <th>Requestor</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr key={approval.prId}>
                  <td><strong>{approval.prId}</strong></td>
                  <td>{approval.description}</td>
                  <td>₹{approval.estimatedValue.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getPriorityBadge(approval.priority)}`}>
                      {approval.priority}
                    </span>
                  </td>
                  <td>{approval.createdBy}</td>
                  <td>{approval.createdAt}</td>
                  <td>
                    {filter === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleApprove(approval.prId)}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleReject(approval.prId)}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-small">View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Approvals;
