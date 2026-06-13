import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, Check, Search, Trash2 } from 'lucide-react';

export function AlertsPanel({ alerts, acknowledgeAlert, clearAllAlerts }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'critical', 'warning', 'info'

  // Filter alerts by search term and level, ignoring acknowledged ones or showing them at the bottom
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    return matchesSearch && alert.level === activeFilter;
  });

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical':
        return <AlertOctagon size={16} className="text-red-500" style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500" style={{ color: '#f59e0b' }} />;
      default:
        return <Info size={16} className="text-cyan-500" style={{ color: '#38bdf8' }} />;
    }
  };

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="alerts-container">
      {/* Alert Header controls */}
      <div className="alerts-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Alarms & Alerts Log</span>
          {activeAlertsCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: '10px',
              fontFamily: "'Orbitron', monospace",
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
            }}>
              {activeAlertsCount} Active
            </span>
          )}
        </div>
        
        {activeAlertsCount > 0 && (
          <button 
            onClick={clearAllAlerts}
            className="ack-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
          >
            <Trash2 size={12} />
            Ack All
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(38, 55, 96, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(5, 8, 17, 0.2)'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(10, 15, 30, 0.6)',
          border: '1px solid rgba(38, 55, 96, 0.4)',
          borderRadius: '6px',
          padding: '4px 8px',
          gap: '8px'
        }}>
          <Search size={14} style={{ color: '#9ca3af' }} />
          <input 
            type="text" 
            placeholder="Search alerts or sources..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              width: '100%',
              fontFamily: "'Inter', sans-serif"
            }}
          />
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['all', 'critical', 'warning', 'info'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveFilter(lvl)}
              style={{
                background: activeFilter === lvl ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: `1px solid ${activeFilter === lvl ? '#38bdf8' : 'rgba(38, 55, 96, 0.3)'}`,
                color: activeFilter === lvl ? '#fff' : '#9ca3af',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.15s ease'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '0.75rem',
            fontStyle: 'italic'
          }}>
            No active alarms match the selected filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${alert.level}`}
              style={{
                opacity: alert.acknowledged ? 0.45 : 1,
                borderLeftWidth: '3px',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            >
              <div className="alert-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getAlertIcon(alert.level)}
                  <span className="alert-level">{alert.level}</span>
                </div>
                <span className="alert-timestamp">{alert.timestamp}</span>
              </div>
              <div className="alert-msg">{alert.message}</div>
              
              <div className="alert-footer">
                <span className="alert-source">Src: {alert.source}</span>
                {!alert.acknowledged ? (
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="ack-btn"
                    title="Acknowledge Alert"
                    style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <Check size={10} />
                    Ack
                  </button>
                ) : (
                  <span style={{ fontSize: '0.6rem', color: '#6b7280', fontFamily: "'Share Tech Mono', monospace" }}>ACKNOWLEDGED</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default AlertsPanel;
