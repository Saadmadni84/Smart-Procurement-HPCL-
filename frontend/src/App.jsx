import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import PurchaseRequests from './pages/PurchaseRequests';
import Approvals from './pages/Approvals';
import Rules from './pages/Rules';
import Reports from './pages/Reports';
import Exceptions from './pages/Exceptions';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/purchase-requests" element={<PurchaseRequests />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: 'var(--space-xxl)' }}>
              <h1 style={{ fontSize: '4rem', color: 'var(--medium-gray)' }}>404</h1>
              <p style={{ color: 'var(--medium-gray)' }}>Page not found</p>
            </div>
          } />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
