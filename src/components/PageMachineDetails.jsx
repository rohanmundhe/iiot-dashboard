import React from 'react';
import { ArrowLeft, Thermometer, Activity, Heart, ShieldAlert, AlertTriangle, Wifi, Server } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { METRIC_CONFIGS } from '../hooks/useGcpData';

export function PageMachineDetails({ machine, history = [], setActivePage }) {
  if (!machine) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        No machine selected.{' '}
        <span style={{ color: '#0ea5e9', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setActivePage('overview')}>Return to Overview</span>
      </div>
    );
  }

  const h = machine.health;
  const hColor = h == null ? '#cbd5e1' : h < 40 ? '#dc2626' : h < 75 ? '#d97706' : '#059669';
  const hTint  = h == null ? '#f1f5f9' : h < 40 ? '#fee2e2' : h < 75 ? '#fef3c7' : '#d1fae5';
  const hLabel = h == null ? '' : h < 40 ? 'danger' : h < 75 ? 'warning' : 'success';

  const mColor = (key, val) => {
    const cfg = METRIC_CONFIGS[key];
    if (!cfg || val == null) return '#0f172a';
    if (cfg.critMax && val >= cfg.critMax) return '#dc2626';
    if (cfg.warnMax && val >= cfg.warnMax) return '#d97706';
    return '#059669';
  };
  const mTint = (key, val) => {
    const cfg = METRIC_CONFIGS[key];
    if (!cfg || val == null) return '#f1f5f9';
    if (cfg.critMax && val >= cfg.critMax) return '#fee2e2';
    if (cfg.warnMax && val >= cfg.warnMax) return '#fef3c7';
    return '#d1fae5';
  };

  const isLive = machine.source === 'thingspeak';

  const chartParams = [
    { id: 'temperature', label: 'Temperature', unit: '°C', Icon: Thermometer },
    { id: 'vibration',   label: 'Vibration',   unit: 'Mag', Icon: Activity }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0, overflowY: 'auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setActivePage('overview')}
            className="back-arrow-btn"
            style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              color: '#475569', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
              {machine.name}
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {machine.description} · Real-time Sensor Analysis
            </span>
          </div>
        </div>

        {/* Source badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px',
          background: isLive ? '#d1fae5' : '#f1f5f9',
          fontSize: '0.68rem', fontWeight: '700',
          color: isLive ? '#065f46' : '#64748b'
        }}>
          {isLive ? <Wifi size={11} /> : <Server size={11} />}
          {isLive ? 'ThingSpeak Live' : 'Simulated'}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>

        {/* Health */}
        <div className={`stat-card ${hLabel}`} style={{ padding: '18px' }}>
          <span className="stat-label">Equipment Health</span>
          <div className="stat-value-container" style={{ marginTop: '6px' }}>
            <span className="stat-value" style={{ fontSize: '2.4rem', color: hColor }}>{h == null ? '' : `${h}%`}</span>
            {machine.health < 40
              ? <ShieldAlert size={26} style={{ color: '#dc2626' }} />
              : machine.health < 75
                ? <AlertTriangle size={26} style={{ color: '#d97706' }} />
                : <Heart size={26} style={{ color: '#059669' }} />
            }
          </div>
          {/* Progress bar */}
          <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ height: '100%', width: `${h ?? 0}%`, background: hColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>
            {h == null ? 'Awaiting sensor data' : h < 40 ? 'Action required — fault detected' : h < 75 ? 'Operating under stress' : 'All systems nominal'}
          </span>
        </div>

        {/* Temperature */}
        {(() => {
          const val = machine.temperature;
          const c = val != null ? mColor('temperature', val) : '#94a3b8';
          const t = val != null ? mTint('temperature', val) : '#f1f5f9';
          return (
            <div className="stat-card" style={{ padding: '18px' }}>
              <span className="stat-label">Temperature</span>
              <div className="stat-value-container" style={{ marginTop: '6px' }}>
                <span className="stat-value" style={{ fontSize: '2.4rem', color: c }}>
                  {val != null ? `${val} °C` : ''}
                </span>
                <Thermometer size={26} style={{ color: c }} />
              </div>
              <div style={{ marginTop: '8px', padding: '5px 10px', background: t, borderRadius: '7px', fontSize: '0.65rem', color: c, fontWeight: '600' }}>
                Optimal {METRIC_CONFIGS.temperature.optMin}–{METRIC_CONFIGS.temperature.optMax}°C · Critical ≥{METRIC_CONFIGS.temperature.critMax}°C
              </div>
            </div>
          );
        })()}

        {/* Vibration */}
        {(() => {
          const val = machine.vibration;
          const c = val != null ? mColor('vibration', val) : '#94a3b8';
          const t = val != null ? mTint('vibration', val) : '#f1f5f9';
          return (
            <div className="stat-card" style={{ padding: '18px' }}>
              <span className="stat-label">Vibration</span>
              <div className="stat-value-container" style={{ marginTop: '6px' }}>
                <span className="stat-value" style={{ fontSize: '2.4rem', color: c }}>
                  {val != null ? `${val} Mag` : ''}
                </span>
                <Activity size={26} style={{ color: c }} />
              </div>
              <div style={{ marginTop: '8px', padding: '5px 10px', background: t, borderRadius: '7px', fontSize: '0.65rem', color: c, fontWeight: '600' }}>
                Normal ≤{METRIC_CONFIGS.vibration.optMax} · Critical ≥{METRIC_CONFIGS.vibration.critMax} Mag
              </div>
            </div>
          );
        })()}
      </div>

      {/* Charts section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8' }}>
          Live Telemetry Charts
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', overflowY: 'auto', paddingBottom: '8px' }}>
          {chartParams.map(({ id, label, unit, Icon }) => {
            const val = machine[id];
            const c = val != null ? mColor(id, val) : '#94a3b8';
            const t = val != null ? mTint(id, val) : '#f1f5f9';
            return (
              <div key={id} style={{
                background: '#ffffff', borderRadius: '12px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Icon size={15} style={{ color: c }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#0f172a' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: c, background: t, padding: '3px 10px', borderRadius: '8px', fontFamily: "'Share Tech Mono', monospace" }}>
                    {val != null ? `${val} ${unit}` : ''}
                  </span>
                </div>
                <div style={{ height: '110px', background: '#f8fafc', borderRadius: '8px', padding: '6px 2px' }}>
                  <TelemetryChart data={history} dataKey={id} strokeColor={c} unit={unit} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default PageMachineDetails;
