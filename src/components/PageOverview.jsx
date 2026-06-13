import React from 'react';
import { ChevronRight, Thermometer, Activity, Wifi, Server } from 'lucide-react';
import AlertsPanel from './AlertsPanel';

function HealthRing({ pct, color }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
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
  const goTo = (id) => { setSelectedMachineId(id); setActivePage('machine'); };

  const hColor = (h) => h == null ? '#cbd5e1' : h < 40 ? '#dc2626' : h < 75 ? '#d97706' : '#059669';
  const hTint  = (h) => h == null ? '#f1f5f9' : h < 40 ? '#fee2e2' : h < 75 ? '#fef3c7' : '#d1fae5';
  const hLabel = (h) => h == null ? 'No Data' : h < 40 ? 'Critical' : h < 75 ? 'Warning' : 'Nominal';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>

      {/* Page title */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Operations Overview</h2>
        <p style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '3px' }}>
          Live health monitoring across all sensor nodes
        </p>
      </div>

      {/* Machine cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' }}>
        {machines.map((m) => {
          const c = hColor(m.health);
          const t = hTint(m.health);
          const live = m.source === 'thingspeak';

          return (
            <div key={m.id} onClick={() => goTo(m.id)} className="machine-overview-card">
              {/* Top stripe */}
              <div className="status-stripe" style={{ background: c }} />

              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>{m.name}</span>
                    {live
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6rem', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: '10px' }}>
                          <Wifi size={9} /> Live
                        </span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6rem', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '10px' }}>
                          <Server size={9} /> Simulated
                        </span>
                    }
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>{m.description}</span>
                </div>
                <ChevronRight size={16} style={{ color: '#cbd5e1', flexShrink: 0 }} />
              </div>

              {/* Ring + readings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                {/* Ring */}
                <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
                  <HealthRing pct={m.health} color={c} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: m.health == null ? '0.7rem' : '1.05rem', fontWeight: '800', color: c, lineHeight: 1 }}>
                      {m.health == null ? '' : m.health}
                    </span>
                    {m.health != null && <span style={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: '600' }}>%</span>}
                  </div>
                </div>

                {/* Right side */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Status chip */}
                  <span style={{
                    alignSelf: 'flex-start', fontSize: '0.62rem', fontWeight: '700',
                    color: c, background: t,
                    padding: '3px 10px', borderRadius: '10px'
                  }}>
                    {hLabel(m.health)}
                  </span>

                  {/* Sensor rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Thermometer size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.68rem', color: '#64748b', minWidth: '72px' }}>Temperature</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: m.temperature == null ? '#94a3b8' : '#0f172a', fontFamily: "'Share Tech Mono', monospace" }}>
                        {m.temperature == null ? '' : `${m.temperature} °C`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.68rem', color: '#64748b', minWidth: '72px' }}>Vibration</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: m.vibration == null ? '#94a3b8' : '#0f172a', fontFamily: "'Share Tech Mono', monospace" }}>
                        {m.vibration == null ? '' : `${m.vibration} Mag`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '500' }}>Health Index</span>
                  <span style={{ color: c, fontWeight: '700' }}>{m.health == null ? '' : `${m.health}%`}</span>
                </div>
                <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.health ?? 0}%`, background: c, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      <div style={{ flex: 1, minHeight: '240px' }}>
        <AlertsPanel alerts={alerts} acknowledgeAlert={acknowledgeAlert} clearAllAlerts={clearAllAlerts} />
      </div>
    </div>
  );
}
export default PageOverview;
