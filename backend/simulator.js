/**
 * Mock sensor data simulator.
 * Mirrors the logic from src/hooks/useGcpData.js so the frontend and backend
 * stay consistent. When GCP Firestore is ready, replace generateMetricValue()
 * and the tick loop in server.js with real Firestore snapshot listeners.
 */

const METRIC_CONFIGS = {
  temperature: { label: 'Temperature', unit: '°C',  optMin: 20, optMax: 30, warnMax: 35, critMax: 40 },
  vibration:   { label: 'Vibration',  unit: 'Mag', optMin: 0,  optMax: 0.01, warnMax: 0.05, critMax: 0.15 }
};

const MACHINE_DEFS = {
  machine_alpha: { name: 'Machine Alpha (LAB 1)', description: 'ESP32 + DHT22 + MPU6050' },
  machine_beta:  { name: 'Machine Beta (LAB 2)',  description: 'Simulated Node' },
  machine_gamma: { name: 'Machine Gamma (LAB 3)', description: 'Simulated Node' }
};

const HEALTH_DECAY_RATES = {
  machine_alpha: 2.8,
  machine_beta:  3.5,
  machine_gamma: 2.2
};

function generateMetricValue(key, t, isAnomaly, machineId) {
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
}

/**
 * State container : the simulator owns this and mutates it each tick.
 * server.js reads from here and broadcasts to SSE clients.
 */
const state = {
  anomalyActive: false,
  timeCounter: 0,
  machines: {
    machine_alpha: { id: 'machine_alpha', ...MACHINE_DEFS.machine_alpha, health: 98, temperature: 25.3, vibration: 0.006 },
    machine_beta:  { id: 'machine_beta',  ...MACHINE_DEFS.machine_beta,  health: 96, temperature: 24.1, vibration: 0.004 },
    machine_gamma: { id: 'machine_gamma', ...MACHINE_DEFS.machine_gamma, health: 95, temperature: 26.7, vibration: 0.007 }
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

    let health = m.health;
    if (state.anomalyActive) {
      health = Math.max(8, health - HEALTH_DECAY_RATES[id] - Math.random() * 0.5);
    } else {
      health = Math.min(95 + Math.floor(Math.sin(t * 0.5) * 3), health + 1.5);
    }
    health = parseFloat(health.toFixed(1));

    [45, 30, 10].forEach(th => {
      if (health <= th && !state.triggeredThresholds[id][th]) {
        newAlerts.push(mkAlert(
          th === 10 ? 'critical' : 'warning',
          `EQUIPMENT STRESS LIMIT: ${m.name} health dropped to ${health}% (Threshold: ${th}%). Urgent service needed!`,
          `${m.name} Diagnostician`
        ));
        state.triggeredThresholds[id][th] = true;
      }
      if (health > th + 5 && state.triggeredThresholds[id][th]) {
        state.triggeredThresholds[id][th] = false;
      }
    });

    if (temp >= METRIC_CONFIGS.temperature.critMax) {
      newAlerts.push(mkAlert('critical', `${m.name} Overheating! Temp=${temp}°C`, `${id}_thermal_node`));
    }
    if (vib >= METRIC_CONFIGS.vibration.critMax) {
      newAlerts.push(mkAlert('critical', `${m.name} High Vibration: ${vib} Mag`, `${id}_vibration_sensor`));
    }

    state.machines[id] = { ...m, health, temperature: temp, vibration: vib };
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
