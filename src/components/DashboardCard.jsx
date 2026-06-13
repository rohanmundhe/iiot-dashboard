import React from 'react';

export function DashboardCard({
  label = 'LAB 1',
  activeTab = 'dashboard',
  setActiveTab,
  badgeColor = '',
  children
}) {
  const tabs = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'temperature',  label: 'Temperature' },
    { id: 'humidity',     label: 'Humidity' },
    { id: 'vibration',   label: 'Vibration' }
  ];

  return (
    <div className="panel-card">
      <div className="panel-header-bar">
        <div className="panel-title-area">
          <div className={`panel-badge ${badgeColor}`}>
            {label.split(' ')[1] || label[0]}
          </div>
          <span className="panel-title">{label}</span>
        </div>

        <div className="panel-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body">
        {children}
      </div>
    </div>
  );
}
export default DashboardCard;
