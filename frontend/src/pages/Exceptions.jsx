import React, { useState, useEffect } from 'react';
import { getAllExceptions, getExceptionsBySeverity, resolveException } from '../services/api';

const Exceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadExceptions();
  }, [filter]);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      let data;
      if (filter === 'ALL') {
        data = await getAllExceptions();
      } else {
        data = await getExceptionsBySeverity(filter);
      }
      setExceptions(data);
    } catch (error) {
      console.error('Error loading exceptions:', error);
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (exceptionId) => {
    const resolution = prompt('Enter resolution notes:');
    if (!resolution) return;

    try {
      await resolveException(exceptionId, resolution, 'current.user@hpcl.co.in');
      alert(`Exception ${exceptionId} resolved!`);
      loadExceptions();
    } catch (error) {
      console.error('Error resolving exception:', error);
      alert('Error resolving exception. Please check backend connection.');
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      HIGH: 'badge-danger',
      MEDIUM: 'badge-warning',
      LOW: 'badge-info',
    };
    return badges[severity] || 'badge-secondary';
  };

  const getStatusBadge = (status) => {
    return status === 'OPEN' ? 'badge-warning' : 'badge-success';
  };

  return (
    <div>
      <h1>Exception Management</h1>
      <p style={{ color: 'var(--medium-gray)', marginBottom: 'var(--space-xl)' }}>
        Track and resolve procurement exceptions and rule violations.
      </p>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('ALL')}
          >
            All Exceptions
          </button>
          <button
            className={`btn ${filter === 'HIGH' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('HIGH')}
          >
            🔴 High Severity
          </button>
          <button
            className={`btn ${filter === 'MEDIUM' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('MEDIUM')}
          >
            🟡 Medium Severity
          </button>
          <button
            className={`btn ${filter === 'LOW' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('LOW')}
          >
            🔵 Low Severity
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Exception Queue</h3>
        {loading ? (
          <div className="spinner"></div>
        ) : exceptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--medium-gray)' }}>
            <p>No exceptions found for selected filter.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Exception ID</th>
                <th>Related PR</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((exception) => (
                <tr key={exception.exceptionId}>
                  <td><strong>{exception.exceptionId}</strong></td>
                  <td>{exception.prId}</td>
                  <td>{exception.description}</td>
                  <td>
                    <span className={`badge ${getSeverityBadge(exception.severity)}`}>
                      {exception.severity}
                    </span>
                  </td>
                  <td>{exception.assignedTo}</td>
                  <td>{exception.createdAt}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(exception.status)}`}>
                      {exception.status}
                    </span>
                  </td>
                  <td>
                    {exception.status === 'OPEN' ? (
                      <button
                        className="btn btn-success btn-small"
                        onClick={() => handleResolve(exception.exceptionId)}
                      >
                        ✅ Resolve
                      </button>
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

      <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)', backgroundColor: 'var(--light-bg)', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--hpcl-navy)' }}>Exception Handling Guidelines</h4>
        <ul style={{ color: 'var(--medium-gray)', lineHeight: '1.8' }}>
          <li><strong>High Severity:</strong> Requires immediate action, escalate if not resolved within 2 hours</li>
          <li><strong>Medium Severity:</strong> Should be resolved within 24 hours</li>
          <li><strong>Low Severity:</strong> Can be resolved within 48 hours</li>
          <li>All resolved exceptions are logged for audit and compliance</li>
        </ul>
      </div>
    </div>
  );
};

export default Exceptions;
