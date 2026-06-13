import React from 'react';
import { Thermometer, Activity, ArrowUpDown } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { METRIC_CONFIGS } from '../hooks/useGcpData';

const ICONS = {
  temperature: <Thermometer size={16} />,
  vibration:   <Activity size={16} />
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

  const hColor = (h) => h < 40 ? '#dc2626' : h < 75 ? '#d97706' : '#059669';
  const hTint  = (h) => h < 40 ? '#fee2e2' : h < 75 ? '#fef3c7' : '#d1fae5';

  const mColor = (val) => {
    if (cfg.critMax && val >= cfg.critMax) return '#dc2626';
    if (cfg.warnMax && val >= cfg.warnMax) return '#d97706';
    return '#059669';
  };
  const mTint = (val) => {
    if (cfg.critMax && val >= cfg.critMax) return '#fee2e2';
    if (cfg.warnMax && val >= cfg.warnMax) return '#fef3c7';
    return '#d1fae5';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
            {ICONS[activeMetric]}
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{cfg.label} Telemetry</h2>
          </div>
          <p style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '3px' }}>
            {cfg.label} readings across all nodes — click a card to drill in
          </p>
        </div>

        <button
          onClick={() => setSortAsc(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#ffffff', border: '1px solid #e2e8f0',
            color: '#475569', padding: '7px 14px', borderRadius: '9px',
            fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowUpDown size={13} />
          {sortAsc ? 'Lowest health first' : 'Highest health first'}
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
        {sorted.map((m) => {
          const val = m[activeMetric];
          const history = histories[m.id] || [];
          const hc = hColor(m.health);
          const ht = hTint(m.health);
          const mc = mColor(val);
          const mt = mTint(val);

          return (
            <div
              key={m.id}
              onClick={() => { setSelectedMachineId(m.id); setActivePage('machine'); }}
              className="parameter-grid-card"
            >
              {/* Top stripe = health colour */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: hc, borderRadius: '14px 14px 0 0' }} />

              {/* Machine header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>{m.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Health:</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: hc, background: ht, padding: '1px 7px', borderRadius: '8px' }}>{m.health}%</span>
                  </div>
                </div>

                {/* Live metric value chip */}
                <div style={{
                  background: mt, color: mc,
                  padding: '6px 12px', borderRadius: '10px',
                  fontSize: '1rem', fontWeight: '800',
                  fontFamily: "'Share Tech Mono', monospace",
                  flexShrink: 0
                }}>
                  {val}
                  <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-sans)', marginLeft: '3px', fontWeight: '600' }}>{cfg.unit}</span>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: '130px', background: '#f8fafc', borderRadius: '10px', padding: '8px 4px' }}>
                <TelemetryChart data={history} dataKey={activeMetric} strokeColor={mc} unit={cfg.unit} />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                <span>Normal ≤ {cfg.optMax} {cfg.unit}</span>
                <span style={{ color: '#0ea5e9', fontWeight: '600' }}>View Details →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default PageParameterGrid;
