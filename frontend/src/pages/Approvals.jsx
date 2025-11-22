import React, { useState, useEffect } from 'react';
import { getPendingApprovals, approveApproval, rejectApproval } from '../services/api';

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
      const data = await getPendingApprovals();
      if (filter !== 'ALL') {
        setApprovals(data.filter(a => a.status === filter));
      } else {
        setApprovals(data);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
      // Fallback to empty array on error
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    const comments = prompt('Enter approval comments (optional):');
    try {
      await approveApproval(approvalId, comments || '', 'current.user@hpcl.co.in');
      alert(`Approval approved successfully!`);
      loadApprovals();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error approving. Please check backend connection.');
    }
  };

  const handleReject = async (approvalId) => {
    const comments = prompt('Enter rejection reason:');
    if (!comments) return;
    
    try {
      await rejectApproval(approvalId, comments, 'current.user@hpcl.co.in');
      alert(`Approval rejected.`);
      loadApprovals();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting. Please check backend connection.');
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
                <th>Approval ID</th>
                <th>PR ID</th>
                <th>Level</th>
                <th>Status</th>
                <th>Approver</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr key={approval.id}>
                  <td><strong>{approval.prId}</strong></td>
                  <td>{approval.prId}</td>
                  <td>Level {approval.approvalLevel}</td>
                  <td>
                    <span className={`badge ${approval.status === 'PENDING' ? 'badge-warning' : approval.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td>{approval.approverName}</td>
                  <td>{new Date(approval.createdAt).toLocaleString()}</td>
                  <td>
                    {filter === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleApprove(approval.id)}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleReject(approval.id)}
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
