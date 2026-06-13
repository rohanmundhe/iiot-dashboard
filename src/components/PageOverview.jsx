import React from 'react';
import { ChevronRight, Cpu, Thermometer, Activity, Heart, ShieldAlert } from 'lucide-react';
import AlertsPanel from './AlertsPanel';

export function PageOverview({ 
  machines = [], 
  alerts = [], 
  acknowledgeAlert, 
  clearAllAlerts, 
  setSelectedMachineId, 
  setActivePage 
}) {

  const handleMachineSelect = (machineId) => {
    if (!machineId) return;
    setSelectedMachineId(machineId);
    setActivePage('machine');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      height: '100%',
      minHeight: 0,
      overflowY: 'auto',
      paddingRight: '4px'
    }}>
      {/* Page Title Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', color: '#fff' }}>
          Operations Overview Control
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Real-time diagnostics and telemetry stream monitor.
        </span>
      </div>

      {/* Top Machine Dropdown Selector */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '16px',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <label style={{ 
          fontSize: '0.75rem', 
          fontWeight: '700', 
          textTransform: 'uppercase', 
          color: 'var(--color-primary)',
          letterSpacing: '0.05em'
        }}>
          Jump to Specific Machine Details:
        </label>
        <select 
          onChange={(e) => handleMachineSelect(e.target.value)}
          defaultValue=""
          style={{
            width: '100%',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '6px',
            outline: 'none',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            boxShadow: 'inset 0 0 10px rgba(56, 189, 248, 0.05)'
          }}
        >
          <option value="" disabled>Select Machine...</option>
          {machines.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} (Health: {m.health}%)
            </option>
          ))}
        </select>
      </div>

      {/* Middle Section: Alerts Board */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
      }}>
        <AlertsPanel 
          alerts={alerts} 
          acknowledgeAlert={acknowledgeAlert} 
          clearAllAlerts={clearAllAlerts} 
        />
      </div>

      {/* Bottom Section: Scrollable Health List of All Machines */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'var(--color-text-dim)',
            letterSpacing: '0.05em'
          }}>
            Operational Machine Health List
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>
            Scrollable Grid ({machines.length} nodes)
          </span>
        </div>

        <div className="scrollable-machine-list" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          maxHeight: '260px',
          overflowY: 'auto',
          paddingBottom: '8px'
        }}>
          {machines.map((m) => {
            // Determine colors for health status
            const healthColor = m.health < 40 ? 'var(--color-danger)' : m.health < 75 ? 'var(--color-warning)' : 'var(--color-success)';
            
            return (
              <div 
                key={m.id}
                onClick={() => handleMachineSelect(m.id)}
                style={{
                  background: 'rgba(10, 15, 30, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'inset 0 0 5px rgba(255,255,255,0.01)'
                }}
                className="machine-overview-card"
              >
                {/* Visual left colored status indicator */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: healthColor,
                  boxShadow: `0 0 8px ${healthColor}`
                }} />

                {/* Machine Name and Chevron */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{m.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{m.description}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', marginTop: '2px' }} />
                </div>

                {/* Health percentage bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Aggregate Health</span>
                    <span style={{ fontFamily: 'var(--font-digital)', fontWeight: 'bold', color: healthColor }}>
                      {m.health}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${m.health}%`,
                      background: healthColor,
                      boxShadow: `0 0 5px ${healthColor}`,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Mini parameters display */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(10, 15, 30, 0.4)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  border: '1px solid rgba(38, 55, 96, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={12} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>Temp:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#fff' }}>
                      {m.temperature}°C
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={12} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>Vib:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#fff' }}>
                      {m.vibration} Mag
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default PageOverview;
