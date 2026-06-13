import React from 'react';
import { ArrowLeft, Thermometer, Activity, Droplet, Heart, ShieldAlert, AlertTriangle } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { METRIC_CONFIGS } from '../hooks/useGcpData';

export function PageMachineDetails({ machine, history = [], setActivePage }) {
  if (!machine) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No machine selected. Return to the{' '}
        <span
          style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setActivePage('overview')}
        >
          Overview
        </span>{' '}
        page.
      </div>
    );
  }

  const healthColor = machine.health < 40
    ? 'var(--color-danger)'
    : machine.health < 75
      ? 'var(--color-warning)'
      : 'var(--color-success)';

  const getStatusColor = (key, val) => {
    const cfg = METRIC_CONFIGS[key];
    if (!cfg || val == null) return 'var(--color-text-main)';
    if (cfg.critMax && val >= cfg.critMax) return 'var(--color-danger)';
    if (cfg.warnMax && val >= cfg.warnMax) return 'var(--color-warning)';
    if (cfg.critMin && val <= cfg.critMin) return 'var(--color-danger)';
    if (cfg.warnMin && val <= cfg.warnMin) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const isLive = machine.source === 'thingspeak';

  const chartParams = [
    { id: 'temperature', label: 'Temperature (°C)', unit: '°C' },
    { id: 'humidity',    label: 'Humidity (%)',     unit: '%' },
    { id: 'vibration',  label: 'Vibration (Mag)',  unit: 'Mag' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setActivePage('overview')}
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--color-primary)',
              width: '32px', height: '32px',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            className="back-arrow-btn"
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', textTransform: 'uppercase', color: '#fff' }}>
              {machine.name} Diagnostics
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {machine.description} • Real-time Sensor Analysis
            </span>
          </div>
        </div>

        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.7rem',
          color: 'var(--color-text-dim)',
          background: 'rgba(10, 15, 30, 0.4)',
          border: '1px solid var(--border-color)',
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          {isLive ? 'THINGSPEAK LIVE NODE' : 'SIMULATOR NODE'}: {machine.id.toUpperCase()}
        </span>
      </div>

      {/* Summary Cards — Health + Temp + Humidity + Vibration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

        {/* Health */}
        <div className={`stat-card ${machine.health < 40 ? 'danger' : machine.health < 75 ? 'warning' : 'success'}`} style={{ padding: '16px' }}>
          <span className="stat-label">Equipment Health</span>
          <div className="stat-value-container" style={{ marginTop: '4px' }}>
            <span className="stat-value" style={{ fontSize: '2.2rem' }}>{machine.health}%</span>
            {machine.health < 40
              ? <ShieldAlert size={24} style={{ color: 'var(--color-danger)', animation: 'pulse 1s infinite' }} />
              : machine.health < 75
                ? <AlertTriangle size={24} style={{ color: 'var(--color-warning)' }} />
                : <Heart size={24} style={{ color: 'var(--color-success)' }} />
            }
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ height: '100%', width: `${machine.health}%`, background: healthColor, boxShadow: `0 0 8px ${healthColor}`, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>
            {machine.health < 40 ? 'Action Required: Node Fault Active' : machine.health < 75 ? 'Warning: Operating under stress' : 'Operating Nominally'}
          </span>
        </div>

        {/* Temperature */}
        <div className="stat-card" style={{ padding: '16px' }}>
          <span className="stat-label">Temperature</span>
          <div className="stat-value-container" style={{ marginTop: '4px' }}>
            <span className="stat-value" style={{ fontSize: '2.2rem', color: getStatusColor('temperature', machine.temperature) }}>
              {machine.temperature} °C
            </span>
            <Thermometer size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            Optimal: {METRIC_CONFIGS.temperature.optMin}°C – {METRIC_CONFIGS.temperature.optMax}°C
          </div>
        </div>

        {/* Humidity */}
        <div className="stat-card" style={{ padding: '16px' }}>
          <span className="stat-label">Humidity</span>
          <div className="stat-value-container" style={{ marginTop: '4px' }}>
            <span className="stat-value" style={{ fontSize: '2.2rem', color: getStatusColor('humidity', machine.humidity) }}>
              {machine.humidity != null ? machine.humidity : '--'} %
            </span>
            <Droplet size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            Optimal: {METRIC_CONFIGS.humidity.optMin}% – {METRIC_CONFIGS.humidity.optMax}%
          </div>
        </div>

        {/* Vibration */}
        <div className="stat-card" style={{ padding: '16px' }}>
          <span className="stat-label">Vibration</span>
          <div className="stat-value-container" style={{ marginTop: '4px' }}>
            <span className="stat-value" style={{ fontSize: '2.2rem', color: getStatusColor('vibration', machine.vibration) }}>
              {machine.vibration} Mag
            </span>
            <Activity size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            Critical: ≥ {METRIC_CONFIGS.vibration.critMax} Mag
          </div>
        </div>
      </div>

      {/* Telemetry Charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-dim)', letterSpacing: '0.05em' }}>
          Telemetry Graph Matrix
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', overflowY: 'auto', paddingBottom: '12px' }}>
          {chartParams.map((param) => {
            const val = machine[param.id];
            if (val == null) return null;
            const color = getStatusColor(param.id, val);

            return (
              <div key={param.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>{param.label}</span>
                  <span style={{ fontFamily: 'var(--font-digital)', fontSize: '0.85rem', fontWeight: 'bold', color }}>
                    {val} {param.unit}
                  </span>
                </div>
                <div style={{ height: '110px', background: 'rgba(5, 8, 17, 0.2)', borderRadius: '6px', padding: '6px 2px' }}>
                  <TelemetryChart data={history} dataKey={param.id} strokeColor={color} unit={param.unit} />
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
