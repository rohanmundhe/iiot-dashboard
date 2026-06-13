import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, Check, Search, Trash2 } from 'lucide-react';

const LEVEL_COLOR = {
  critical: '#dc2626',
  warning:  '#d97706',
  info:     '#0ea5e9'
};

export function AlertsPanel({ alerts, acknowledgeAlert, clearAllAlerts }) {
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = alerts.filter(a => {
    const q = a.message.toLowerCase().includes(query.toLowerCase()) ||
              a.source.toLowerCase().includes(query.toLowerCase());
    return filter === 'all' ? q : q && a.level === filter;
  });

  const activeCount = alerts.filter(a => !a.acknowledged).length;

  const Icon = ({ level }) => {
    if (level === 'critical') return <AlertOctagon size={14} style={{ color: '#dc2626', flexShrink: 0 }} />;
    if (level === 'warning')  return <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }} />;
    return <Info size={14} style={{ color: '#0ea5e9', flexShrink: 0 }} />;
  };

  const FILTERS = ['all', 'critical', 'warning', 'info'];

  return (
    <div className="alerts-container">

      {/* Header */}
      <div className="alerts-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Alerts Log</span>
          {activeCount > 0 && (
            <span style={{
              background: '#dc2626', color: '#fff',
              fontSize: '0.62rem', fontWeight: '700',
              padding: '1px 7px', borderRadius: '10px'
            }}>
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAllAlerts} className="ack-btn">
            <Trash2 size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Search + filter */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '8px', padding: '6px 10px'
        }}>
          <Search size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search alerts…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#0f172a', fontSize: '0.75rem', width: '100%',
              fontFamily: "'Inter', sans-serif"
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          {FILTERS.map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              style={{
                padding: '3px 10px', borderRadius: '6px',
                fontSize: '0.64rem', fontWeight: '600',
                textTransform: 'capitalize', cursor: 'pointer',
                border: filter === lvl ? `1px solid ${LEVEL_COLOR[lvl] || '#0ea5e9'}` : '1px solid #e2e8f0',
                background: filter === lvl ? (lvl === 'all' ? '#e0f2fe' : lvl === 'critical' ? '#fee2e2' : lvl === 'warning' ? '#fef3c7' : '#e0f2fe') : '#ffffff',
                color: filter === lvl ? (LEVEL_COLOR[lvl] || '#0284c7') : '#64748b',
                transition: 'all 0.12s ease'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="alerts-list">
        {filtered.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
            No alerts match the current filter.
          </div>
        ) : (
          filtered.map(alert => (
            <div
              key={alert.id}
              className={`alert-item ${alert.level}`}
              style={{ opacity: alert.acknowledged ? 0.5 : 1, transition: 'opacity 0.2s' }}
            >
              <div className="alert-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon level={alert.level} />
                  <span className="alert-level">{alert.level}</span>
                </div>
                <span className="alert-timestamp">{alert.timestamp}</span>
              </div>

              <div className="alert-msg">{alert.message}</div>

              <div className="alert-footer">
                <span className="alert-source">{alert.source}</span>
                {!alert.acknowledged
                  ? <button onClick={() => acknowledgeAlert(alert.id)} className="ack-btn">
                      <Check size={10} /> Ack
                    </button>
                  : <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '600' }}>ACKNOWLEDGED</span>
                }
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default AlertsPanel;
