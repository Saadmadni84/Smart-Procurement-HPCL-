import React from 'react';

const StatsCard = ({ label, value, subtitle, variant = 'default', icon }) => {
  const variantClass = variant !== 'default' ? `stat-card ${variant}` : 'stat-card';
  
  return (
    <div className={variantClass}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
};

export default StatsCard;
