import { useState, useEffect, useCallback, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Configurations for sensor parameters
export const METRIC_CONFIGS = {
  temperature: { label: 'Temperature', unit: '°C', icon: 'thermometer', optMin: 40, optMax: 70, warnMax: 80, critMax: 95 },
  vibration: { label: 'Vibration', unit: 'Mag', icon: 'activity', optMin: 0.8, optMax: 2.2, warnMax: 3.5, critMax: 5.0 },
  current: { label: 'Current', unit: 'A', icon: 'zap', optMin: 8, optMax: 16, warnMax: 20, critMax: 25 },
  voltage: { label: 'Voltage', unit: 'V', icon: 'cpu', optMin: 215, optMax: 235, warnMin: 205, warnMax: 245, critMin: 195, critMax: 255 },
  coolantFlow: { label: 'Coolant Flow', unit: 'L/min', icon: 'droplet', optMin: 10, optMax: 14, warnMin: 8, critMin: 5 }
};

export const MACHINE_METRICS = {
  machine_alpha: { name: 'Machine Alpha (LAB 1)', desc: 'Primary Rotary Assembly' },
  machine_beta: { name: 'Machine Beta (LAB 2)', desc: 'Secondary Pneumatic Pump' },
  machine_gamma: { name: 'Machine Gamma (LAB 3)', desc: 'Thermal Conditioning Reactor' }
};

// Help generate baseline values with stochastic noise
const generateMetricValue = (key, t, isAnomaly, machineId) => {
  const config = METRIC_CONFIGS[key];
  const mid = (config.optMin + (config.optMax || config.optMin * 1.5)) / 2;
  const range = ((config.optMax || config.optMin * 1.5) - config.optMin) * 0.4;
  
  // Create slight phase shift based on machineId
  const phase = machineId === 'machine_alpha' ? 0 : machineId === 'machine_beta' ? 2 : 4;
  let val = mid + Math.sin(t + phase) * range + (Math.random() - 0.5) * (range * 0.2);

  if (isAnomaly) {
    // Escalate values based on machine susceptibility
    if (machineId === 'machine_alpha' && (key === 'temperature' || key === 'vibration')) {
      val = config.warnMax + (config.critMax - config.warnMax) * 1.05 + Math.random() * 4;
    } else if (machineId === 'machine_beta' && (key === 'coolantFlow' || key === 'temperature')) {
      if (key === 'coolantFlow') {
        val = config.critMin * 0.75 - Math.random() * 1.5; // Coolant drops
      } else {
        val = config.warnMax + Math.random() * 5; // Temp rises
      }
    } else if (machineId === 'machine_gamma' && (key === 'voltage' || key === 'current')) {
      if (key === 'voltage') {
        val = config.critMin * 0.9 + Math.random() * 5; // Voltage brownout
      } else {
        val = config.warnMax + Math.random() * 3;
      }
    }
  }

  return parseFloat(Math.max(0, val).toFixed(2));
};

export function useGcpData() {
  const [connectionState, setConnectionState] = useState('mock'); // 'mock' or 'live'
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [alerts, setAlerts] = useState([
    {
      id: 'init-1',
      level: 'info',
      message: 'GCP Cloud Broker connected. Monitoring Firestore snapshot data.',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      source: 'GCP Firestore Proxy',
      acknowledged: false
    },
    {
      id: 'init-2',
      level: 'info',
      message: 'Node synchronization completed. All 3 machines telemetry channels active.',
      timestamp: new Date().toLocaleTimeString(),
      source: 'IIoT Gateway Manager',
      acknowledged: false
    }
  ]);

  // Telemetry rolling histories (last 20 logs) for each machine
  const [histories, setHistories] = useState({
    machine_alpha: [],
    machine_beta: [],
    machine_gamma: []
  });

  // Keep track of which health thresholds have already triggered alerts for which machines
  // (to prevent spamming alerts repeatedly in the same anomaly state)
  const triggeredThresholds = useRef({
    machine_alpha: { 45: false, 30: false, 10: false },
    machine_beta: { 45: false, 30: false, 10: false },
    machine_gamma: { 45: false, 30: false, 10: false }
  });

  // Current statuses of all machines
  const [machines, setMachines] = useState({
    machine_alpha: {
      id: 'machine_alpha',
      name: MACHINE_METRICS.machine_alpha.name,
      description: MACHINE_METRICS.machine_alpha.desc,
      health: 98,
      temperature: 52.3,
      vibration: 1.45,
      current: 11.2,
      voltage: 224,
      coolantFlow: 11.8
    },
    machine_beta: {
      id: 'machine_beta',
      name: MACHINE_METRICS.machine_beta.name,
      description: MACHINE_METRICS.machine_beta.desc,
      health: 96,
      temperature: 50.1,
      vibration: 1.22,
      current: 10.8,
      voltage: 223,
      coolantFlow: 12.1
    },
    machine_gamma: {
      id: 'machine_gamma',
      name: MACHINE_METRICS.machine_gamma.name,
      description: MACHINE_METRICS.machine_gamma.desc,
      health: 95,
      temperature: 48.7,
      vibration: 1.34,
      current: 12.5,
      voltage: 226,
      coolantFlow: 11.2
    }
  });

  const timeCounter = useRef(0);

  // Trigger alert logs helper
  const triggerAlert = useCallback((level, message, source = 'System') => {
    const newAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: new Date().toLocaleTimeString(),
      source,
      acknowledged: false
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 100));
  }, []);

  const acknowledgeAlert = useCallback((id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    if (connectionState === 'live') {
      fetch(`${BACKEND_URL}/api/alerts/${id}/acknowledge`, { method: 'POST' }).catch(() => {});
    }
  }, [connectionState]);

  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    if (connectionState === 'live') {
      fetch(`${BACKEND_URL}/api/alerts/clear`, { method: 'POST' }).catch(() => {});
    }
  }, [connectionState]);

  // ── MOCK mode: local interval simulation ─────────────────────────────────
  useEffect(() => {
    if (connectionState !== 'mock') return;

    const interval = setInterval(() => {
      timeCounter.current += 0.1;
      const t = timeCounter.current;
      const timestamp = new Date().toLocaleTimeString();

      setMachines(prevMachines => {
        const updated = {};

        Object.keys(prevMachines).forEach(id => {
          const m = prevMachines[id];

          const temp = generateMetricValue('temperature', t, anomalyActive, id);
          const vib  = generateMetricValue('vibration',   t, anomalyActive, id);
          const curr = generateMetricValue('current',     t, anomalyActive, id);
          const volt = generateMetricValue('voltage',     t, anomalyActive, id);
          const flow = generateMetricValue('coolantFlow', t, anomalyActive, id);

          let health = m.health;
          if (anomalyActive) {
            const decayRates = { machine_alpha: 2.8, machine_beta: 3.5, machine_gamma: 2.2 };
            health = Math.max(8, health - decayRates[id] - Math.random() * 0.5);
          } else {
            health = Math.min(95 + Math.floor(Math.sin(t * 0.5) * 3), health + 1.5);
          }
          health = parseFloat(health.toFixed(1));

          const thresholds = [45, 30, 10];
          thresholds.forEach(th => {
            if (health <= th && !triggeredThresholds.current[id][th]) {
              const level = th === 10 ? 'critical' : 'warning';
              triggerAlert(level,
                `EQUIPMENT STRESS LIMIT: ${m.name} health dropped to ${health}% (Threshold reached: ${th}%). Urgent service needed!`,
                `${m.name} Diagnostician`);
              triggeredThresholds.current[id][th] = true;
            }
          });
          thresholds.forEach(th => {
            if (health > th + 5 && triggeredThresholds.current[id][th]) {
              triggeredThresholds.current[id][th] = false;
            }
          });

          if (temp > METRIC_CONFIGS.temperature.critMax) {
            triggerAlert('critical', `${m.name} Overheating! Temperature reached ${temp}°C. Core shutdown check active.`, `${id}_thermal_node`);
          }
          if (vib > METRIC_CONFIGS.vibration.critMax) {
            triggerAlert('critical', `${m.name} High Vibration: ${vib} Mag. Rotor assembly off-axis warning.`, `${id}_vibration_sensor`);
          }

          updated[id] = { ...m, health, temperature: temp, vibration: vib, current: curr, voltage: volt, coolantFlow: flow };

          setHistories(prevHist => ({
            ...prevHist,
            [id]: [...prevHist[id], { timestamp, temperature: temp, vibration: vib, current: curr, voltage: volt, coolantFlow: flow }].slice(-25)
          }));
        });

        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [connectionState, anomalyActive, triggerAlert]);

  // ── LIVE mode: SSE stream from backend ────────────────────────────────────
  useEffect(() => {
    if (connectionState !== 'live') return;

    const es = new EventSource(`${BACKEND_URL}/api/sse/telemetry`);

    es.addEventListener('alert_snapshot', (e) => {
      try {
        const snapshot = JSON.parse(e.data);
        setAlerts(snapshot);
      } catch (_) {}
    });

    es.addEventListener('telemetry', (e) => {
      try {
        const { machines: updatedMachines, newAlerts, timestamp } = JSON.parse(e.data);

        setMachines(prev => {
          const next = { ...prev };
          updatedMachines.forEach(m => { next[m.id] = m; });
          return next;
        });

        setHistories(prev => {
          const next = { ...prev };
          updatedMachines.forEach(m => {
            const entry = {
              timestamp: new Date(timestamp).toLocaleTimeString(),
              temperature: m.temperature,
              vibration:   m.vibration,
              current:     m.current,
              voltage:     m.voltage,
              coolantFlow: m.coolantFlow
            };
            next[m.id] = [...(next[m.id] || []), entry].slice(-25);
          });
          return next;
        });

        if (newAlerts && newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
        }
      } catch (_) {}
    });

    es.addEventListener('new_alert', (e) => {
      try {
        const alert = JSON.parse(e.data);
        setAlerts(prev => [alert, ...prev].slice(0, 100));
      } catch (_) {}
    });

    es.addEventListener('alert_update', (e) => {
      try {
        const { id, acknowledged } = JSON.parse(e.data);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged } : a));
      } catch (_) {}
    });

    es.addEventListener('alerts_cleared', () => {
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    });

    es.onerror = () => {
      triggerAlert('warning', 'Lost connection to backend. Retrying...', 'SSE Manager');
    };

    return () => es.close();
  }, [connectionState, triggerAlert]);

  // Actions
  const toggleAnomaly = useCallback(() => {
    if (connectionState === 'live') {
      // Delegate to backend
      const next = !anomalyActive;
      fetch(`${BACKEND_URL}/api/simulate/anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next })
      }).catch(() => triggerAlert('warning', 'Could not reach backend for anomaly toggle.', 'SSE Manager'));
      setAnomalyActive(next);
    } else {
      setAnomalyActive(prev => {
        const next = !prev;
        if (next) {
          triggerAlert('critical', 'TEST ANOMALY ENGAGED: Inducing simulated electrical overload, bearing failure, and coolant drops.', 'GCP Test Suite');
        } else {
          Object.keys(triggeredThresholds.current).forEach(id => {
            triggeredThresholds.current[id] = { 45: false, 30: false, 10: false };
          });
          triggerAlert('info', 'Anomaly Simulation cleared. Telemetry signals stabilizing.', 'GCP Test Suite');
        }
        return next;
      });
    }
  }, [connectionState, anomalyActive, triggerAlert]);

  const toggleConnection = useCallback(() => {
    setConnectionState(prev => {
      const next = prev === 'mock' ? 'live' : 'mock';
      triggerAlert('info', `Active data pipeline changed to: ${next === 'live' ? 'Backend SSE (http://localhost:4000)' : 'Local Mock Data Emulator'}`, 'Gateway Manager');
      return next;
    });
  }, [triggerAlert]);

  return {
    connectionState,
    anomalyActive,
    alerts,
    machines: Object.values(machines),
    histories,
    toggleAnomaly,
    toggleConnection,
    acknowledgeAlert,
    clearAllAlerts,
    triggerAlert
  };
}
