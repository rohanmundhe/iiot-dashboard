import React from 'react';
import { ChevronRight, Thermometer, Activity, Wifi, Cpu } from 'lucide-react';
import AlertsPanel from './AlertsPanel';

function HealthRing({ pct, color }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

export function PageOverview({
  machines = [],
  alerts = [],
  acknowledgeAlert,
  clearAllAlerts,
  setSelectedMachineId,
  setActivePage
}) {
  const handleMachineSelect = (id) => {
    setSelectedMachineId(id);
    setActivePage('machine');
  };

  const getHealthColor = (h) =>
    h < 40 ? 'var(--color-danger)' : h < 75 ? 'var(--color-warning)' : 'var(--color-success)';

  const getStatusLabel = (h) =>
    h < 40 ? 'CRITICAL' : h < 75 ? 'WARNING' : 'NOMINAL';

  const getStatusStyle = (h) => {
    if (h < 40) return { color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' };
    if (h < 75) return { color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' };
    return { color: 'var(--color-success)', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%', minHeight: 0, overflowY: 'auto' }}>

      {/* Page heading */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em' }}>
          Operations Overview
        </h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
          Live health monitoring across all sensor nodes
        </p>
      </div>

      {/* Machine cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {machines.map((m) => {
          const hc = getHealthColor(m.health);
          const st = getStatusStyle(m.health);
          const isLive = m.source === 'thingspeak';

          return (
            <div
              key={m.id}
              onClick={() => handleMachineSelect(m.id)}
              className="machine-overview-card"
            >
              {/* Top colour stripe */}
              <div className="status-stripe" style={{ background: hc }} />

              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{m.name}</span>
                    {isLive && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        fontSize: '0.58rem', fontWeight: '700', textTransform: 'uppercase',
                        color: 'var(--color-success)', background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.30)', padding: '1px 6px', borderRadius: '10px'
                      }}>
                        <Wifi size={8} /> Live
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{m.description}</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', marginTop: '2px', flexShrink: 0 }} />
              </div>

              {/* Health ring + value */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                  <HealthRing pct={m.health} color={hc} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontFamily: 'var(--font-digital)', fontSize: '1rem', fontWeight: '700', color: hc, lineHeight: 1 }}>
                      {m.health}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>%</span>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Status badge */}
                  <span style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: st.color, background: st.bg,
                    border: `1px solid ${st.border}`,
                    padding: '3px 10px', borderRadius: '12px'
                  }}>
                    {getStatusLabel(m.health)}
                  </span>

                  {/* Sensor readings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Thermometer size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', minWidth: '60px' }}>Temperature</span>
                      <span style={{ fontFamily: 'var(--font-digital)', fontSize: '0.78rem', color: '#fff', fontWeight: '700' }}>
                        {m.temperature} °C
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', minWidth: '60px' }}>Vibration</span>
                      <span style={{ fontFamily: 'var(--font-digital)', fontSize: '0.78rem', color: '#fff', fontWeight: '700' }}>
                        {m.vibration} Mag
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>
                  <span>Equipment Health</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: hc }}>{m.health}%</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${m.health}%`,
                    background: hc, boxShadow: `0 0 6px ${hc}`,
                    borderRadius: '3px', transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts panel */}
      <div style={{ flex: 1, minHeight: '260px' }}>
        <AlertsPanel alerts={alerts} acknowledgeAlert={acknowledgeAlert} clearAllAlerts={clearAllAlerts} />
      </div>
    </div>
  );
}
export default PageOverview;
