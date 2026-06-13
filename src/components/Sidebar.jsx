import React from 'react';
import { 
  Home, 
  Thermometer, 
  Activity, 
  Zap, 
  Cpu, 
  Droplet, 
  User 
} from 'lucide-react';

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
    { id: 'vibration', label: 'Vibration', icon: <Activity size={16} />, unit: 'Mag' },
    { id: 'current', label: 'Current', icon: <Zap size={16} />, unit: 'A' },
    { id: 'voltage', label: 'Voltage', icon: <Cpu size={16} />, unit: 'V' },
    { id: 'coolantFlow', label: 'Coolant Flow', icon: <Droplet size={16} />, unit: 'L/min' }
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px 16px',
      gap: '24px',
      flexShrink: 0
    }}>
      {/* Login Profile Area */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(10, 15, 30, 0.5)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        boxShadow: 'inset 0 0 5px rgba(56, 189, 248, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <User size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{userName}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lead IIoT Engineer
            </span>
          </div>
        </div>

        {/* Network status connection dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.65rem',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid rgba(38, 55, 96, 0.3)',
          paddingTop: '6px',
          marginTop: '2px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: connectionState === 'live' ? 'var(--color-success)' : 'var(--color-warning)',
            boxShadow: connectionState === 'live' ? '0 0 6px var(--color-success)' : '0 0 6px var(--color-warning)'
          }} />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase' }}>
            {connectionState === 'live' ? 'GCP Firestore Online' : 'Mock Live Emulator'}
          </span>
        </div>
      </div>

      {/* Main Home Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => setActivePage('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            background: activePage === 'overview' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            border: `1px solid ${activePage === 'overview' ? 'var(--color-primary)' : 'transparent'}`,
            color: activePage === 'overview' ? '#fff' : 'var(--color-text-muted)',
            padding: '10px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}
        >
          <Home size={16} />
          <span>Home Overview</span>
        </button>
      </nav>

      {/* Parameter Telemetry Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'var(--color-text-dim)',
          letterSpacing: '0.08em',
          paddingLeft: '8px'
        }}>
          Collected Data Types
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const isSelected = activePage === 'parameter' && activeMetric === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMetricClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}`,
                  color: isSelected ? '#fff' : 'var(--color-text-muted)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.65rem',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-dim)'
                }}>
                  {item.unit}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding info */}
      <div style={{
        fontSize: '0.6rem',
        color: 'var(--color-text-dim)',
        fontFamily: "'Share Tech Mono', monospace",
        textAlign: 'center',
        borderTop: '1px solid rgba(38, 55, 96, 0.2)',
        paddingTop: '12px'
      }}>
        GCP CLOUD GATEWAY V2.1.0
      </div>
    </aside>
  );
}
export default Sidebar;
