import React from 'react';
import { Thermometer, Activity, ArrowUpDown } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { METRIC_CONFIGS } from '../hooks/useGcpData';

const ICONS = {
  temperature: <Thermometer size={15} />,
  vibration:   <Activity size={15} />
};

export function PageParameterGrid({
  machines = [],
  activeMetric = 'temperature',
  histories = {},
  setSelectedMachineId,
  setActivePage
}) {
  const [sortAsc, setSortAsc] = React.useState(true);

  const cfg = METRIC_CONFIGS[activeMetric];
  if (!cfg) return null;

  const sorted = [...machines]
    .filter(m => m[activeMetric] != null)
    .sort((a, b) => sortAsc ? a.health - b.health : b.health - a.health);

  const getHealthColor = (h) =>
    h < 40 ? 'var(--color-danger)' : h < 75 ? 'var(--color-warning)' : 'var(--color-success)';

  const getMetricColor = (val) => {
    if (!cfg) return 'var(--color-primary)';
    if (cfg.critMax && val >= cfg.critMax) return 'var(--color-danger)';
    if (cfg.warnMax && val >= cfg.warnMax) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%', minHeight: 0, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            {ICONS[activeMetric]}
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em' }}>
              {cfg.label} Telemetry
            </h2>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
            {cfg.label} readings across all nodes — click a card to drill in
          </p>
        </div>

        <button
          onClick={() => setSortAsc(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(56, 189, 248, 0.07)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: 'var(--color-text-muted)',
            padding: '6px 14px', borderRadius: '8px',
            fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowUpDown size={12} />
          {sortAsc ? 'Lowest health first' : 'Highest health first'}
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        {sorted.map((m) => {
          const val = m[activeMetric];
          const history = histories[m.id] || [];
          const hc = getHealthColor(m.health);
          const mc = getMetricColor(val);

          return (
            <div
              key={m.id}
              onClick={() => { setSelectedMachineId(m.id); setActivePage('machine'); }}
              className="parameter-grid-card"
            >
              {/* Top border stripe using health colour */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: hc }} />

              {/* Machine name + live value */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{m.name}</span>
                  <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Health: <span style={{ color: hc, fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{m.health}%</span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(10,15,30,0.65)',
                  border: `1px solid ${mc}`,
                  color: mc,
                  fontFamily: 'var(--font-digital)',
                  padding: '5px 10px', borderRadius: '8px',
                  fontSize: '0.95rem', fontWeight: '700',
                  boxShadow: `0 0 10px ${mc}22`,
                  flexShrink: 0
                }}>
                  {val} <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>{cfg.unit}</span>
                </div>
              </div>

              {/* Chart */}
              <div style={{
                height: '130px',
                background: 'rgba(5, 8, 17, 0.35)',
                borderRadius: '8px',
                padding: '8px 4px',
                border: '1px solid rgba(38, 55, 96, 0.15)'
              }}>
                <TelemetryChart data={history} dataKey={activeMetric} strokeColor={mc} unit={cfg.unit} />
              </div>

              {/* Range info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Normal ≤ {cfg.optMax} {cfg.unit}</span>
                <span style={{ color: 'var(--color-primary)' }}>View Details →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default PageParameterGrid;
