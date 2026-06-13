/**
 * Mock sensor data simulator.
 * Mirrors the logic from src/hooks/useGcpData.js so the frontend and backend
 * stay consistent. When GCP Firestore is ready, replace generateMetricValue()
 * and the tick loop in server.js with real Firestore snapshot listeners.
 */

const METRIC_CONFIGS = {
  temperature: { label: 'Temperature', unit: '°C', optMin: 40, optMax: 70, warnMax: 80, critMax: 95 },
  vibration:   { label: 'Vibration',   unit: 'Mag', optMin: 0.8, optMax: 2.2, warnMax: 3.5, critMax: 5.0 },
  current:     { label: 'Current',     unit: 'A',   optMin: 8, optMax: 16, warnMax: 20, critMax: 25 },
  voltage:     { label: 'Voltage',     unit: 'V',   optMin: 215, optMax: 235, warnMin: 205, warnMax: 245, critMin: 195, critMax: 255 },
  coolantFlow: { label: 'Coolant Flow', unit: 'L/min', optMin: 10, optMax: 14, warnMin: 8, critMin: 5 }
};

const MACHINE_DEFS = {
  machine_alpha: { name: 'Machine Alpha (LAB 1)', description: 'Primary Rotary Assembly' },
  machine_beta:  { name: 'Machine Beta (LAB 2)',  description: 'Secondary Pneumatic Pump' },
  machine_gamma: { name: 'Machine Gamma (LAB 3)', description: 'Thermal Conditioning Reactor' }
};

const HEALTH_DECAY_RATES = {
  machine_alpha: 2.8,
  machine_beta:  3.5,
  machine_gamma: 2.2
};

function generateMetricValue(key, t, isAnomaly, machineId) {
  const config = METRIC_CONFIGS[key];
  const mid   = (config.optMin + (config.optMax || config.optMin * 1.5)) / 2;
  const range = ((config.optMax || config.optMin * 1.5) - config.optMin) * 0.4;

  const phase = machineId === 'machine_alpha' ? 0 : machineId === 'machine_beta' ? 2 : 4;
  let val = mid + Math.sin(t + phase) * range + (Math.random() - 0.5) * (range * 0.2);

  if (isAnomaly) {
    if (machineId === 'machine_alpha' && (key === 'temperature' || key === 'vibration')) {
      val = config.warnMax + (config.critMax - config.warnMax) * 1.05 + Math.random() * 4;
    } else if (machineId === 'machine_beta' && (key === 'coolantFlow' || key === 'temperature')) {
      val = key === 'coolantFlow'
        ? config.critMin * 0.75 - Math.random() * 1.5
        : config.warnMax + Math.random() * 5;
    } else if (machineId === 'machine_gamma' && (key === 'voltage' || key === 'current')) {
      val = key === 'voltage'
        ? config.critMin * 0.9 + Math.random() * 5
        : config.warnMax + Math.random() * 3;
    }
  }

  return parseFloat(Math.max(0, val).toFixed(2));
}

/**
 * State container — the simulator owns this and mutates it each tick.
 * server.js reads from here and broadcasts to SSE clients.
 */
const state = {
  anomalyActive: false,
  timeCounter: 0,
  machines: {
    machine_alpha: { id: 'machine_alpha', ...MACHINE_DEFS.machine_alpha, health: 98,  temperature: 52.3, vibration: 1.45, current: 11.2, voltage: 224, coolantFlow: 11.8 },
    machine_beta:  { id: 'machine_beta',  ...MACHINE_DEFS.machine_beta,  health: 96,  temperature: 50.1, vibration: 1.22, current: 10.8, voltage: 223, coolantFlow: 12.1 },
    machine_gamma: { id: 'machine_gamma', ...MACHINE_DEFS.machine_gamma, health: 95,  temperature: 48.7, vibration: 1.34, current: 12.5, voltage: 226, coolantFlow: 11.2 }
  },
  // tracks which health thresholds have fired to avoid spam
  triggeredThresholds: {
    machine_alpha: { 45: false, 30: false, 10: false },
    machine_beta:  { 45: false, 30: false, 10: false },
    machine_gamma: { 45: false, 30: false, 10: false }
  }
};

/**
 * Advance the simulator by one tick. Returns an array of any new alert objects
 * generated this tick so the caller can append them to the alert log.
 */
function tick() {
  state.timeCounter += 0.1;
  const t = state.timeCounter;
  const timestamp = new Date().toISOString();
  const newAlerts = [];

  const mkAlert = (level, message, source) => ({
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    level,
    message,
    timestamp,
    source,
    acknowledged: false
  });

  Object.keys(state.machines).forEach(id => {
    const m = state.machines[id];

    const temp = generateMetricValue('temperature', t, state.anomalyActive, id);
    const vib  = generateMetricValue('vibration',   t, state.anomalyActive, id);
    const curr = generateMetricValue('current',     t, state.anomalyActive, id);
    const volt = generateMetricValue('voltage',     t, state.anomalyActive, id);
    const flow = generateMetricValue('coolantFlow', t, state.anomalyActive, id);

    let health = m.health;
    if (state.anomalyActive) {
      health = Math.max(8, health - HEALTH_DECAY_RATES[id] - Math.random() * 0.5);
    } else {
      health = Math.min(95 + Math.floor(Math.sin(t * 0.5) * 3), health + 1.5);
    }
    health = parseFloat(health.toFixed(1));

    // Health threshold alerts
    [45, 30, 10].forEach(th => {
      if (health <= th && !state.triggeredThresholds[id][th]) {
        const level = th === 10 ? 'critical' : 'warning';
        newAlerts.push(mkAlert(
          level,
          `EQUIPMENT STRESS LIMIT: ${m.name} health dropped to ${health}% (Threshold: ${th}%). Urgent service needed!`,
          `${m.name} Diagnostician`
        ));
        state.triggeredThresholds[id][th] = true;
      }
      if (health > th + 5 && state.triggeredThresholds[id][th]) {
        state.triggeredThresholds[id][th] = false;
      }
    });

    // Sensor critical alerts
    if (temp > METRIC_CONFIGS.temperature.critMax) {
      newAlerts.push(mkAlert('critical', `${m.name} Overheating! Temp=${temp}°C`, `${id}_thermal_node`));
    }
    if (vib > METRIC_CONFIGS.vibration.critMax) {
      newAlerts.push(mkAlert('critical', `${m.name} High Vibration: ${vib} Mag`, `${id}_vibration_sensor`));
    }

    state.machines[id] = { ...m, health, temperature: temp, vibration: vib, current: curr, voltage: volt, coolantFlow: flow };
  });

  return newAlerts;
}

function setAnomaly(active) {
  state.anomalyActive = active;
  if (!active) {
    // reset thresholds so they can fire again next anomaly
    Object.keys(state.triggeredThresholds).forEach(id => {
      state.triggeredThresholds[id] = { 45: false, 30: false, 10: false };
    });
  }
}

function getMachinesArray() {
  return Object.values(state.machines);
}

module.exports = { tick, setAnomaly, getMachinesArray, state };
