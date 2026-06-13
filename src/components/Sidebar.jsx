import React from 'react';
import { Home, Thermometer, Activity, User, Wifi, Server } from 'lucide-react';

export function Sidebar({
  activePage,
  setActivePage,
  activeMetric,
  setActiveMetric,
  connectionState,
  userName = "Pushkar Shelar"
}) {
  const handleMetricClick = (metricId) => {
    setActiveMetric(metricId);
    setActivePage('parameter');
  };

  const menuItems = [
    { id: 'temperature', label: 'Temperature', icon: <Thermometer size={16} />, unit: '°C' },
    { id: 'vibration',   label: 'Vibration',   icon: <Activity size={16} />,    unit: 'Mag' }
  ];

  const isLive = connectionState === 'live';

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px 14px',
      gap: '6px',
      flexShrink: 0
    }}>

      {/* Brand */}
      <div style={{ padding: '4px 8px 18px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#0ea5e9',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wifi size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>IIoT Monitor</div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: '500' }}>ThingSpeak Gateway</div>
          </div>
        </div>
      </div>

      {/* Connection status pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px', borderRadius: '10px',
        background: isLive ? '#d1fae5' : '#fef3c7',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: isLive ? '#059669' : '#d97706',
          flexShrink: 0
        }} />
        <span style={{
          fontSize: '0.68rem', fontWeight: '600',
          color: isLive ? '#065f46' : '#92400e'
        }}>
          {isLive ? 'ThingSpeak Connected' : 'Simulator Mode'}
        </span>
      </div>

      {/* Nav label */}
      <div style={{ padding: '4px 8px', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#94a3b8', marginTop: '6px' }}>
        Navigation
      </div>

      {/* Home */}
      <button
        onClick={() => setActivePage('overview')}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          width: '100%', padding: '9px 12px', borderRadius: '9px',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontSize: '0.82rem', fontWeight: '600',
          background: activePage === 'overview' ? '#e0f2fe' : 'transparent',
          color: activePage === 'overview' ? '#0284c7' : '#475569',
          transition: 'all 0.15s ease'
        }}
      >
        <Home size={15} />
        <span>Overview</span>
      </button>

      {/* Sensor label */}
      <div style={{ padding: '4px 8px', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#94a3b8', marginTop: '10px' }}>
        Sensor Data
      </div>

      {/* Sensor nav */}
      {menuItems.map((item) => {
        const isSelected = activePage === 'parameter' && activeMetric === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleMetricClick(item.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '9px 12px', borderRadius: '9px',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              fontSize: '0.82rem', fontWeight: '500',
              background: isSelected ? '#e0f2fe' : 'transparent',
              color: isSelected ? '#0284c7' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {item.icon}
              <span>{item.label}</span>
            </div>
            <span style={{
              fontSize: '0.62rem', fontFamily: "'Share Tech Mono', monospace",
              color: isSelected ? '#0284c7' : '#94a3b8', fontWeight: '700'
            }}>
              {item.unit}
            </span>
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User card */}
      <div style={{
        padding: '12px', borderRadius: '12px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: '#0ea5e9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <User size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>{userName}</div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>IIoT Engineer</div>
        </div>
      </div>
    </aside>
  );
}
export default Sidebar;
