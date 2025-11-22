import React, { useState, useEffect } from 'react';
import { getAllRules, createRule } from '../services/api';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    expression: '',
    mandatory: false,
    owner: '',
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await getAllRules();
      setRules(data);
    } catch (error) {
      console.error('Error loading rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await createRule(formData);
      setShowModal(false);
      setFormData({
        name: '',
        expression: '',
        mandatory: false,
        owner: '',
      });
      loadRules();
      alert('Rule created successfully!');
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Error creating rule. Please check backend connection.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h1>Business Rules</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Add New Rule
        </button>
      </div>

      <div className="card">
        <h3>Active Rules ({rules.length})</h3>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Name</th>
                <th>Expression</th>
                <th>Mandatory</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td><strong>{rule.ruleId}</strong></td>
                  <td>{rule.description}</td>
                  <td>
                    <code style={{ fontSize: '0.85rem', padding: '2px 6px', backgroundColor: 'var(--light-bg)', borderRadius: '4px' }}>
                      {rule.fieldName} {rule.operator} {rule.ruleValue}
                    </code>
                  </td>
                  <td>
                    {rule.severity === 'HIGH' || rule.severity === 'CRITICAL' ? (
                      <span className="badge badge-danger">{rule.severity}</span>
                    ) : (
                      <span className="badge badge-info">{rule.severity}</span>
                    )}
                  </td>
                  <td>{rule.createdBy || 'SYSTEM'}</td>
                  <td>
                    <span className={`badge ${rule.active ? 'badge-success' : 'badge-secondary'}`}>
                      {rule.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-small">Edit</button>
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
              <h3 className="modal-title">Create New Business Rule</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateRule}>
              <div className="form-group">
                <label className="form-label required">Rule Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Value > 1L requires CFO approval"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Rule Expression (DRL)</label>
                <textarea
                  className="form-textarea"
                  value={formData.expression}
                  onChange={(e) => setFormData({ ...formData, expression: e.target.value })}
                  required
                  placeholder="estimatedValue > 100000"
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                ></textarea>
                <small style={{ color: 'var(--medium-gray)', display: 'block', marginTop: '4px' }}>
                  Use Drools syntax. Example: estimatedValue {'>'} 100000 || category == "IT_HARDWARE"
                </small>
              </div>

              <div className="form-group">
                <label className="form-label required">Owner</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  required
                  placeholder="Finance Team"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <input
                    type="checkbox"
                    checked={formData.mandatory}
                    onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                  />
                  <span>Mandatory Rule (Blocks PR if violated)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rules;
