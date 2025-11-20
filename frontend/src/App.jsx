import { useState } from 'react'

function App() {
  return (
    <div>
      <header className="hpcl-header">
        <div className="logo">HPCL Procurement</div>
        <nav className="nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#requests">Purchase Requests</a>
          <a href="#approvals">Approvals</a>
          <a href="#rules">Rules</a>
          <a href="#reports">Reports</a>
        </nav>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>HPCL Procurement Automation System</h1>
        <p style={{ fontSize: '1.1rem', marginTop: '1rem', color: '#001F3F' }}>
          Welcome to the Procurement Automation Dashboard
        </p>

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#003366', marginBottom: '0.5rem' }}>Pending Approvals</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#E4002B' }}>0</p>
          </div>

          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#003366', marginBottom: '0.5rem' }}>Active PRs</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#FFB400' }}>0</p>
          </div>

          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#003366', marginBottom: '0.5rem' }}>Rules Active</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#003366' }}>6</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#003366', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="hpcl-btn-primary">Create New PR</button>
            <button className="hpcl-btn-secondary">View Approvals</button>
            <button className="hpcl-btn-primary">Manage Rules</button>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#F8FAFB', borderRadius: '8px', border: '1px solid #003366' }}>
          <p style={{ fontSize: '0.9rem', color: '#001F3F' }}>
            <strong>Status:</strong> Backend API running at <code>http://localhost:8080</code> | 
            Frontend connected ✅
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
