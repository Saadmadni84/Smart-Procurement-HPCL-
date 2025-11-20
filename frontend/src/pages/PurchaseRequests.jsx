import React, { useState, useEffect } from 'react';
import { getAllPRs, createPR } from '../services/api';

const PurchaseRequests = () => {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'IT_HARDWARE',
    estimatedValue: '',
    department: '',
    costCenter: '',
    requiredByDate: '',
    justification: '',
  });

  useEffect(() => {
    loadPRs();
  }, []);

  const loadPRs = async () => {
    setLoading(true);
    try {
      // const data = await getAllPRs();
      // setPrs(data);
      // Mock data for now
      setPrs([
        { prId: 'PR-2025-05-001', description: '5 Dell Laptops', estimatedValue: 250000, status: 'PENDING_APPROVAL', createdAt: '2025-11-20', createdBy: 'John Doe' },
        { prId: 'PR-2025-05-002', description: 'Office Furniture', estimatedValue: 150000, status: 'APPROVED', createdAt: '2025-11-19', createdBy: 'Jane Smith' },
        { prId: 'PR-2025-05-003', description: 'Software Licenses', estimatedValue: 500000, status: 'REJECTED', createdAt: '2025-11-18', createdBy: 'Bob Johnson' },
      ]);
    } catch (error) {
      console.error('Error loading PRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePR = async (e) => {
    e.preventDefault();
    try {
      await createPR(formData);
      setShowModal(false);
      setFormData({
        description: '',
        category: 'IT_HARDWARE',
        estimatedValue: '',
        department: '',
        costCenter: '',
        requiredByDate: '',
        justification: '',
      });
      loadPRs();
    } catch (error) {
      console.error('Error creating PR:', error);
      alert('Error creating PR. Please check backend connection.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING_APPROVAL: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
      COMPLETED: 'badge-info',
    };
    return badges[status] || 'badge-secondary';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h1>Purchase Requests</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Create New PR
        </button>
      </div>

      <div className="card">
        <h3>All Purchase Requests</h3>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>PR ID</th>
                <th>Description</th>
                <th>Value (INR)</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr key={pr.prId}>
                  <td><strong>{pr.prId}</strong></td>
                  <td>{pr.description}</td>
                  <td>₹{pr.estimatedValue.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(pr.status)}`}>
                      {pr.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{pr.createdBy}</td>
                  <td>{pr.createdAt}</td>
                  <td>
                    <button className="btn btn-secondary btn-small">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Purchase Request</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreatePR}>
              <div className="form-group">
                <label className="form-label required">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="e.g., 5 Dell Laptops for IT Department"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="IT_HARDWARE">IT Hardware</option>
                  <option value="IT_SOFTWARE">IT Software</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="STATIONERY">Stationery</option>
                  <option value="SERVICES">Services</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Estimated Value (INR)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  required
                  placeholder="250000"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  placeholder="IT"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Justification</label>
                <textarea
                  className="form-textarea"
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  required
                  placeholder="Explain the need for this purchase..."
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create PR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
