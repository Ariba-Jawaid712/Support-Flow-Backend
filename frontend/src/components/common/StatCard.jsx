import React from 'react';

export const StatCard = ({ title, value, icon, color = 'var(--primary)', bgColor = 'var(--primary-light)' }) => {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ backgroundColor: bgColor, color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  );
};
