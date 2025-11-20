import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { id: 1, title: 'Create New PR', icon: '➕', path: '/purchase-requests/create' },
    { id: 2, title: 'View Approvals', icon: '✅', path: '/approvals' },
    { id: 3, title: 'Manage Rules', icon: '⚙️', path: '/rules' },
    { id: 4, title: 'View Reports', icon: '📊', path: '/reports' },
  ];

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <div
          key={action.id}
          className="quick-action-card"
          onClick={() => navigate(action.path)}
        >
          <div className="quick-action-icon">{action.icon}</div>
          <div className="quick-action-title">{action.title}</div>
        </div>
      ))}
    </div>
  );
};

export default QuickActions;
