import { useState, useEffect, useCallback, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Only the 3 metrics the ESP32 actually measures and uses for health
export const METRIC_CONFIGS = {
  temperature: { label: 'Temperature', unit: '°C',  icon: 'thermometer', optMin: 20, optMax: 30, warnMax: 35, critMax: 40 },
  vibration:   { label: 'Vibration',  unit: 'Mag', icon: 'activity',    optMin: 0,  optMax: 0.01, warnMax: 0.05, critMax: 0.15 }
};

export const MACHINE_METRICS = {
  machine_alpha: { name: 'Machine Alpha (LAB 1)', desc: 'ESP32 + DHT22 + MPU6050' },
  machine_beta:  { name: 'Machine Beta (LAB 2)',  desc: 'Simulated Node' },
  machine_gamma: { name: 'Machine Gamma (LAB 3)', desc: 'Simulated Node' }
};

const generateMetricValue = (key, t, isAnomaly, machineId) => {
  const phase = machineId === 'machine_alpha' ? 0 : machineId === 'machine_beta' ? 2 : 4;

  if (key === 'temperature') {
    let val = 25 + Math.sin(t + phase) * 4 + (Math.random() - 0.5) * 1.5;
    if (isAnomaly) val = 38 + Math.random() * 5;
    return parseFloat(Math.max(15, val).toFixed(1));
  }

  if (key === 'vibration') {
    let val = 0.005 + Math.abs(Math.sin(t * 1.3 + phase)) * 0.008 + Math.random() * 0.003;
    if (isAnomaly) val = 0.12 + Math.random() * 0.15;
    return parseFloat(Math.max(0, val).toFixed(4));
  }

  return 0;
};

export function useGcpData() {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [alerts, setAlerts] = useState([
    {
      id: 'init-1',
      level: 'warning',
      message: 'ThingSpeak Read API key not configured. Add THINGSPEAK_READ_API_KEY to backend/.env and restart the server.',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      source: 'IIoT Gateway',
      acknowledged: false
    },
    {
      id: 'init-2',
      level: 'info',
      message: 'Dashboard ready. Awaiting ThingSpeak connection. No live sensor data available yet.',
      timestamp: new Date().toLocaleTimeString(),
      source: 'IIoT Dashboard',
      acknowledged: false
    }
  ]);

  const [histories, setHistories] = useState({
    machine_alpha: [],
    machine_beta:  [],
    machine_gamma: []
  });

  const triggeredThresholds = useRef({
    machine_alpha: { 45: false, 30: false, 10: false },
    machine_beta:  { 45: false, 30: false, 10: false },
    machine_gamma: { 45: false, 30: false, 10: false }
  });

  const [machines, setMachines] = useState({
    machine_alpha: { id: 'machine_alpha', name: MACHINE_METRICS.machine_alpha.name, description: MACHINE_METRICS.machine_alpha.desc, health: null, temperature: null, vibration: null },
    machine_beta:  { id: 'machine_beta',  name: MACHINE_METRICS.machine_beta.name,  description: MACHINE_METRICS.machine_beta.desc,  health: null, temperature: null, vibration: null },
    machine_gamma: { id: 'machine_gamma', name: MACHINE_METRICS.machine_gamma.name, description: MACHINE_METRICS.machine_gamma.desc, health: null, temperature: null, vibration: null }
  });

  const timeCounter = useRef(0);

  const triggerAlert = useCallback((level, message, source = 'System') => {
    setAlerts(prev => [{
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level, message,
      timestamp: new Date().toLocaleTimeString(),
      source, acknowledged: false
    }, ...prev].slice(0, 100));
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

  // ── MOCK mode ─────────────────────────────────────────────────────────────
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

          let health = m.health;
          if (anomalyActive) {
            const decay = { machine_alpha: 2.8, machine_beta: 3.5, machine_gamma: 2.2 };
            health = Math.max(8, health - decay[id] - Math.random() * 0.5);
          } else {
            health = Math.min(95 + Math.floor(Math.sin(t * 0.5) * 3), health + 1.5);
          }
          health = parseFloat(health.toFixed(1));

          [45, 30, 10].forEach(th => {
            if (health <= th && !triggeredThresholds.current[id][th]) {
              triggerAlert(th === 10 ? 'critical' : 'warning',
                `EQUIPMENT STRESS LIMIT: ${m.name} health at ${health}% (Threshold: ${th}%). Urgent service needed!`,
                `${m.name} Diagnostician`);
              triggeredThresholds.current[id][th] = true;
            }
            if (health > th + 5 && triggeredThresholds.current[id][th]) {
              triggeredThresholds.current[id][th] = false;
            }
          });

          if (temp >= METRIC_CONFIGS.temperature.critMax)
            triggerAlert('critical', `${m.name} Overheating! Temperature reached ${temp}°C.`, `${id}_thermal_node`);
          if (vib >= METRIC_CONFIGS.vibration.critMax)
            triggerAlert('critical', `${m.name} High Vibration: ${vib} Mag.`, `${id}_vibration_sensor`);

          updated[id] = { ...m, health, temperature: temp, vibration: vib };
          setHistories(prev => ({
            ...prev,
            [id]: [...prev[id], { timestamp, temperature: temp, vibration: vib }].slice(-25)
          }));
        });
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [connectionState, anomalyActive, triggerAlert]);

  // ── LIVE mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (connectionState !== 'live') return;

    const es = new EventSource(`${BACKEND_URL}/api/sse/telemetry`);

    es.addEventListener('alert_snapshot', (e) => {
      try { setAlerts(JSON.parse(e.data)); } catch (_) {}
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
            next[m.id] = [...(next[m.id] || []), {
              timestamp: new Date(timestamp).toLocaleTimeString(),
              temperature: m.temperature,
              vibration:   m.vibration
            }].slice(-25);
          });
          return next;
        });
        if (newAlerts?.length > 0)
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
      } catch (_) {}
    });

    es.addEventListener('new_alert', (e) => {
      try { setAlerts(prev => [JSON.parse(e.data), ...prev].slice(0, 100)); } catch (_) {}
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

  const toggleAnomaly = useCallback(() => {
    if (connectionState === 'live') {
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
          triggerAlert('critical', 'TEST ANOMALY ENGAGED: Inducing simulated overload and sensor spikes.', 'IIoT Test Suite');
        } else {
          Object.keys(triggeredThresholds.current).forEach(id => {
            triggeredThresholds.current[id] = { 45: false, 30: false, 10: false };
          });
          triggerAlert('info', 'Anomaly simulation cleared. Telemetry signals stabilising.', 'IIoT Test Suite');
        }
        return next;
      });
    }
  }, [connectionState, anomalyActive, triggerAlert]);

  const toggleConnection = useCallback(() => {
    setConnectionState(prev => {
      const next = prev === 'mock' ? 'live' : 'mock';
      triggerAlert('info',
        next === 'live'
          ? 'Switched to Live mode. ThingSpeak SSE active. Machine Alpha uses ESP32 sensor data.'
          : 'Switched to Simulator mode. Local mock data active.',
        'Gateway Manager');
      return next;
    });
  }, [triggerAlert]);

  return {
    connectionState, anomalyActive, alerts,
    machines: Object.values(machines),
    histories,
    toggleAnomaly, toggleConnection, acknowledgeAlert, clearAllAlerts, triggerAlert
  };
}
