import React from 'react';

const Reports = () => {
  return (
    <div>
      <h1>Reports & Analytics</h1>
      <p style={{ color: 'var(--medium-gray)', marginBottom: 'var(--space-xl)' }}>
        View procurement insights, trends, and performance metrics.
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">TOTAL SPENT (MTD)</div>
          <div className="stat-value" style={{ fontSize: '2.5rem', color: 'var(--hpcl-navy)' }}>
            ₹12.5Cr
          </div>
          <div className="stat-subtitle">⬆ 15% vs last month</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">AVG APPROVAL TIME</div>
          <div className="stat-value" style={{ fontSize: '2.5rem', color: 'var(--success-green)' }}>
            8h
          </div>
          <div className="stat-subtitle">⬇ 85% improvement</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ACTIVE VENDORS</div>
          <div className="stat-value" style={{ fontSize: '2.5rem', color: 'var(--hpcl-navy)' }}>
            247
          </div>
          <div className="stat-subtitle">12 new this month</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">PENDING PAYMENTS</div>
          <div className="stat-value" style={{ fontSize: '2.5rem', color: 'var(--warning-orange)' }}>
            ₹3.2Cr
          </div>
          <div className="stat-subtitle">45 invoices</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
        <h3>Category-wise Spending</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Total Value</th>
              <th>Avg Value</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>IT Hardware</strong></td>
              <td>125</td>
              <td>₹5.2Cr</td>
              <td>₹4.16L</td>
              <td><span className="badge badge-success">⬆ 12%</span></td>
            </tr>
            <tr>
              <td><strong>IT Software</strong></td>
              <td>89</td>
              <td>₹3.8Cr</td>
              <td>₹4.27L</td>
              <td><span className="badge badge-success">⬆ 8%</span></td>
            </tr>
            <tr>
              <td><strong>Furniture</strong></td>
              <td>45</td>
              <td>₹1.5Cr</td>
              <td>₹3.33L</td>
              <td><span className="badge badge-danger">⬇ 5%</span></td>
            </tr>
            <tr>
              <td><strong>Stationery</strong></td>
              <td>230</td>
              <td>₹0.8Cr</td>
              <td>₹0.35L</td>
              <td><span className="badge badge-info">→ 0%</span></td>
            </tr>
            <tr>
              <td><strong>Services</strong></td>
              <td>67</td>
              <td>₹1.2Cr</td>
              <td>₹1.79L</td>
              <td><span className="badge badge-success">⬆ 18%</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
        <h3>Top Vendors by Volume</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Total Orders</th>
              <th>Total Value</th>
              <th>On-Time %</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Dell India</strong></td>
              <td>85</td>
              <td>₹3.5Cr</td>
              <td>92%</td>
              <td>⭐⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td><strong>HP Inc</strong></td>
              <td>67</td>
              <td>₹2.8Cr</td>
              <td>88%</td>
              <td>⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td><strong>Microsoft India</strong></td>
              <td>45</td>
              <td>₹2.1Cr</td>
              <td>95%</td>
              <td>⭐⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td><strong>Godrej Interio</strong></td>
              <td>38</td>
              <td>₹1.2Cr</td>
              <td>85%</td>
              <td>⭐⭐⭐⭐</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', backgroundColor: 'var(--light-bg)', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ color: 'var(--medium-gray)', marginBottom: 'var(--space-sm)' }}>
          📊 <strong>Advanced Analytics Coming Soon</strong>
        </p>
        <small style={{ color: 'var(--medium-gray)' }}>
          Interactive charts, predictive insights, and custom report builder will be available in the next release.
        </small>
      </div>
    </div>
  );
};

export default Reports;
