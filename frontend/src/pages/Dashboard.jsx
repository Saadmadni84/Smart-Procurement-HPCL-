import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import QuickActions from '../components/QuickActions';
import { getDashboardMetrics } from '../services/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    pendingApprovals: 12,
    activePRs: 45,
    rulesActive: 127,
    avgCycleTime: '8 hours',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // const data = await getDashboardMetrics();
      // setMetrics(data);
      // Using mock data for now since backend endpoints are not implemented yet
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--medium-gray)', marginBottom: 'var(--space-xl)' }}>
        Welcome back! Here's your procurement overview.
      </p>

      <div className="stats-grid">
        <StatsCard
          label="Pending Approvals"
          value={metrics.pendingApprovals}
          subtitle="⏱ 3 urgent"
          variant="warning"
          icon="⏰"
        />
        <StatsCard
          label="Active PRs"
          value={metrics.activePRs}
          subtitle="✅ 15 in PO stage"
          variant="success"
          icon="📋"
        />
        <StatsCard
          label="Rules Active"
          value={metrics.rulesActive}
          subtitle="🟢 All OK"
          variant="info"
          icon="⚙️"
        />
        <StatsCard
          label="Avg Cycle Time"
          value={metrics.avgCycleTime}
          subtitle="⬇ 85% faster"
          variant="success"
          icon="⚡"
        />
      </div>

      <h3 style={{ marginBottom: 'var(--space-md)' }}>Quick Actions</h3>
      <QuickActions />

      <div className="card">
        <h3>Recent Activity</h3>
        <table className="table">
          <thead>
            <tr>
              <th>PR ID</th>
              <th>Status</th>
              <th>Value</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PR-2025-05-045</td>
              <td><span className="badge badge-success">Approved</span></td>
              <td>₹2.5L</td>
              <td>2 hours ago</td>
            </tr>
            <tr>
              <td>PR-2025-05-044</td>
              <td><span className="badge badge-warning">Pending</span></td>
              <td>₹3.2L</td>
              <td>4 hours ago</td>
            </tr>
            <tr>
              <td>PR-2025-05-043</td>
              <td><span className="badge badge-success">Completed</span></td>
              <td>₹1.8L</td>
              <td>6 hours ago</td>
            </tr>
            <tr>
              <td>PR-2025-05-042</td>
              <td><span className="badge badge-danger">Rejected</span></td>
              <td>₹5.0L</td>
              <td>1 day ago</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)', backgroundColor: 'var(--white)', borderRadius: '8px', textAlign: 'center' }}>
        <small style={{ color: 'var(--medium-gray)' }}>
          HPCL Procurement Automation System v1.0.0 | Backend: http://localhost:8080 | Frontend: http://localhost:3000
        </small>
      </div>
    </div>
  );
};

export default Dashboard;
