import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function TelemetryChart({ data, dataKey, strokeColor = '#38bdf8', unit = '', domain }) {
  // Generate gradient IDs dynamically to avoid clashes
  const gradientId = `grad-${dataKey}`;

  // Custom tooltips matching the digital dark aesthetic
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(10, 15, 30, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)',
          backdropFilter: 'blur(8px)'
        }}>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Time: {payload[0].payload.timestamp}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontFamily: "'Share Tech Mono', monospace", color: '#fff', fontWeight: 'bold' }}>
            <span style={{ color: strokeColor }}>● </span>
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '110px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
            {/* SVG glow filter for a neon line effect */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis 
            dataKey="timestamp" 
            hide={true} 
          />
          <YAxis 
            domain={domain || ['auto', 'auto']}
            stroke="#4b5563"
            tick={{ fill: '#9ca3af', fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={1.8}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            filter="url(#glow)"
            isAnimationActive={false} // Disable entry animations for real-time scrolling speed
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export default TelemetryChart;
