import React, { useState } from 'react';
import { ArrowUpDown, Thermometer, Activity, Droplet } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { METRIC_CONFIGS } from '../hooks/useGcpData';

export function PageParameterGrid({ 
  machines = [], 
  activeMetric = 'temperature', 
  histories = {},
  setSelectedMachineId,
  setActivePage
}) {
  const [sortOrder, setSortOrder] = useState('ascending'); // 'ascending' = lowest health first, 'descending' = highest health first

  const metricConfig = METRIC_CONFIGS[activeMetric];
  if (!metricConfig) return <div>Metric configuration not found.</div>;

  // Clone and sort machines by health
  const sortedMachines = [...machines].sort((a, b) => {
    if (sortOrder === 'ascending') {
      return a[activeMetric] === undefined ? 1 : b[activeMetric] === undefined ? -1 : a.health - b.health;
    } else {
      return a[activeMetric] === undefined ? 1 : b[activeMetric] === undefined ? -1 : b.health - a.health;
    }
  });

  const getMetricIcon = (metricId) => {
    if (metricId === 'temperature') return <Thermometer size={16} />;
    if (metricId === 'vibration')   return <Activity size={16} />;
    return <Droplet size={16} />;
  };

  const handleMachineClick = (machineId) => {
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
      overflowY: 'auto'
    }}>
      {/* Header Bar with Sort Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            {getMetricIcon(activeMetric)}
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', color: '#fff' }}>
              {metricConfig.label} Telemetry Matrix
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Comparing {metricConfig.label} metrics across all machines, ordered by equipment health.
          </span>
        </div>

        {/* Sort order toggle button */}
        <button
          onClick={() => setSortOrder(prev => prev === 'ascending' ? 'descending' : 'ascending')}
          className="control-btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowUpDown size={12} />
          <span>Sorting: {sortOrder === 'ascending' ? 'Lowest Health First' : 'Highest Health First'}</span>
        </button>
      </div>

      {/* Grid of Graphs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {sortedMachines.map((m) => {
          const val = m[activeMetric];
          const history = histories[m.id] || [];
          
          if (val === undefined) return null;

          // Determine card border colors based on machine health status
          const healthColor = m.health < 40 ? 'var(--color-danger)' : m.health < 75 ? 'var(--color-warning)' : 'var(--color-success)';

          // Determine metric specific status color (e.g. is temp critical?)
          let metricStatusColor = 'var(--color-primary)';
          if (metricConfig.critMax && val >= metricConfig.critMax) metricStatusColor = 'var(--color-danger)';
          else if (metricConfig.warnMax && val >= metricConfig.warnMax) metricStatusColor = 'var(--color-warning)';
          else if (metricConfig.critMin && val <= metricConfig.critMin) metricStatusColor = 'var(--color-danger)';
          else if (metricConfig.warnMin && val <= metricConfig.warnMin) metricStatusColor = 'var(--color-warning)';
          else metricStatusColor = 'var(--color-success)';

          return (
            <div
              key={m.id}
              onClick={() => handleMachineClick(m.id)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="parameter-grid-card"
            >
              {/* Highlight top border with machine health status */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '3px',
                background: healthColor
              }} />

              {/* Machine Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{m.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Health Index: {m.health}%</span>
                </div>

                <div style={{
                  background: 'rgba(10, 15, 30, 0.6)',
                  border: `1px solid ${metricStatusColor}`,
                  color: metricStatusColor,
                  fontFamily: 'var(--font-digital)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  boxShadow: `0 0 8px ${metricStatusColor}22`
                }}>
                  {val} {metricConfig.unit}
                </div>
              </div>

              {/* Telemetry Graph container */}
              <div style={{ 
                height: '140px', 
                background: 'rgba(5, 8, 17, 0.3)', 
                borderRadius: '6px', 
                padding: '8px 4px',
                border: '1px solid rgba(38, 55, 96, 0.1)'
              }}>
                <TelemetryChart 
                  data={history} 
                  dataKey={activeMetric} 
                  strokeColor={metricStatusColor}
                  unit={metricConfig.unit}
                />
              </div>

              {/* Bottom statistics and metadata */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)'
              }}>
                <span>Optimal: {metricConfig.optMin} - {metricConfig.optMax || metricConfig.optMin * 1.5} {metricConfig.unit}</span>
                <span style={{ color: 'var(--color-primary)' }}>Analyze Node →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default PageParameterGrid;
