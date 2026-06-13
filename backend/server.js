require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { tick, setAnomaly, getMachinesArray, state } = require('./simulator');
const { isConfigured, fetchLatestReading, CHANNEL_ID } = require('./thingspeak');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// ── Alert log (kept server-side) ─────────────────────────────────────────────
const MAX_ALERTS = 100;
const tsConfigured = isConfigured();

let alertLog = [
  {
    id: 'init-1',
    level: 'info',
    message: tsConfigured
      ? `ThingSpeak integration active. Polling channel ${CHANNEL_ID} for live sensor data.`
      : 'Backend API server started. Running in simulator mode (ThingSpeak not configured).',
    timestamp: new Date().toISOString(),
    source: 'IIoT Backend',
    acknowledged: false
  },
  {
    id: 'init-2',
    level: 'info',
    message: tsConfigured
      ? 'Machine Alpha linked to ThingSpeak (ESP32 + DHT22 + MPU6050). Beta/Gamma running on simulator.'
      : 'All 3 machine telemetry channels initialized in simulator mode. SSE stream ready.',
    timestamp: new Date().toISOString(),
    source: 'IIoT Gateway Manager',
    acknowledged: false
  }
];

function pushAlert(alert) {
  alertLog = [alert, ...alertLog].slice(0, MAX_ALERTS);
}

// ── SSE client registry ───────────────────────────────────────────────────────
const sseClients = new Set();

function broadcastSSE(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => res.write(payload));
}

// ── ThingSpeak alert thresholds (match code.c logic) ─────────────────────────
// Tracks which health thresholds have fired to avoid spam (resets when health recovers)
const tsTriggered = { h45: false, h30: false, h10: false };

function checkThingSpeakAlerts(reading) {
  const alerts = [];
  const mk = (level, message) => ({
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    level, message,
    timestamp: new Date().toISOString(),
    source: 'Machine Alpha (ThingSpeak)',
    acknowledged: false
  });

  const { temperature, vibration, health } = reading;

  // Temperature thresholds (°C) — from code.c getTempHealth()
  if (temperature != null && temperature >= 40) {
    alerts.push(mk('critical', `Machine Alpha Overheating! Temp=${temperature.toFixed(1)}°C (Critical ≥40°C)`));
  } else if (temperature != null && temperature >= 35) {
    alerts.push(mk('warning', `Machine Alpha Temperature Warning: ${temperature.toFixed(1)}°C (Warn ≥35°C)`));
  }

  // Vibration thresholds — from code.c CRITICAL_THRESHOLD / WARNING_THRESHOLD
  if (vibration != null && vibration >= 0.15) {
    alerts.push(mk('critical', `Machine Alpha High Vibration: ${vibration.toFixed(4)} Mag (Critical ≥0.15)`));
  } else if (vibration != null && vibration >= 0.05) {
    alerts.push(mk('warning', `Machine Alpha Vibration Warning: ${vibration.toFixed(4)} Mag (Warn ≥0.05)`));
  }

  // Health drop thresholds (one-shot per crossing)
  if (health != null) {
    [{ th: 10, level: 'critical' }, { th: 30, level: 'warning' }, { th: 45, level: 'warning' }].forEach(({ th, level }) => {
      const key = `h${th}`;
      if (health <= th && !tsTriggered[key]) {
        alerts.push(mk(level, `EQUIPMENT STRESS LIMIT: Machine Alpha health at ${health.toFixed(1)}% (Threshold: ${th}%). Urgent service needed!`));
        tsTriggered[key] = true;
      }
      if (health > th + 5 && tsTriggered[key]) {
        tsTriggered[key] = false;
      }
    });
  }

  return alerts;
}

// ── Simulator tick loop (1.5 s) ───────────────────────────────────────────────
setInterval(() => {
  const newAlerts = tick();
  newAlerts.forEach(a => pushAlert(a));

  broadcastSSE('telemetry', {
    machines:  getMachinesArray(),
    newAlerts,
    timestamp: new Date().toISOString()
  });
}, 1500);

// ── ThingSpeak poll loop (16 s — respects free tier rate limit) ───────────────
if (tsConfigured) {
  const pollThingSpeak = async () => {
    try {
      const reading = await fetchLatestReading();
      const m = state.machines['machine_alpha'];

      // Merge real sensor values into machine_alpha; keep simulated current/voltage/coolantFlow
      state.machines['machine_alpha'] = {
        ...m,
        source:      'thingspeak',
        temperature: reading.temperature != null ? parseFloat(reading.temperature.toFixed(1)) : m.temperature,
        vibration:   reading.vibration   != null ? parseFloat(reading.vibration.toFixed(4))   : m.vibration,
        health:      reading.health      != null ? parseFloat(reading.health.toFixed(1))       : m.health,
        lastThingSpeakUpdate: reading.timestamp
      };

      const newAlerts = checkThingSpeakAlerts(reading);
      newAlerts.forEach(a => pushAlert(a));
      if (newAlerts.length > 0) {
        newAlerts.forEach(a => broadcastSSE('new_alert', a));
      }
    } catch (err) {
      console.warn('[ThingSpeak] Fetch failed:', err.message);
      pushAlert({
        id: `alert-${Date.now()}`,
        level: 'warning',
        message: `ThingSpeak fetch failed: ${err.message}. Machine Alpha showing last known values.`,
        timestamp: new Date().toISOString(),
        source: 'ThingSpeak Poller',
        acknowledged: false
      });
    }
  };

  // First poll immediately on startup
  pollThingSpeak();
  setInterval(pollThingSpeak, 16000);
  console.log(`[ThingSpeak] Polling channel ${CHANNEL_ID} every 16 s`);
} else {
  console.log('[ThingSpeak] Not configured — using simulator for all machines.');
  console.log('[ThingSpeak] Set THINGSPEAK_CHANNEL_ID and THINGSPEAK_READ_API_KEY in backend/.env to enable.');
}

// ── REST Routes ───────────────────────────────────────────────────────────────

// GET /api/machines  — snapshot of all machines
app.get('/api/machines', (_req, res) => {
  res.json(getMachinesArray());
});

// GET /api/machines/:id
app.get('/api/machines/:id', (req, res) => {
  const machine = state.machines[req.params.id];
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  res.json(machine);
});

// GET /api/alerts
app.get('/api/alerts', (_req, res) => {
  res.json(alertLog);
});

// POST /api/alerts/:id/acknowledge
app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const alert = alertLog.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.acknowledged = true;
  broadcastSSE('alert_update', { id: alert.id, acknowledged: true });
  res.json({ ok: true });
});

// POST /api/alerts/clear  — mark all acknowledged
app.post('/api/alerts/clear', (_req, res) => {
  alertLog.forEach(a => { a.acknowledged = true; });
  broadcastSSE('alerts_cleared', {});
  res.json({ ok: true });
});

// POST /api/simulate/anomaly  — body: { active: true | false }
app.post('/api/simulate/anomaly', (req, res) => {
  const active = Boolean(req.body.active);
  setAnomaly(active);

  const msg = active
    ? 'TEST ANOMALY ENGAGED: Inducing simulated overload, bearing failure, and coolant drops.'
    : 'Anomaly simulation cleared. Telemetry signals stabilizing.';

  const alert = {
    id: `alert-${Date.now()}`,
    level: active ? 'critical' : 'info',
    message: msg,
    timestamp: new Date().toISOString(),
    source: 'IIoT Test Suite',
    acknowledged: false
  };
  pushAlert(alert);
  broadcastSSE('new_alert', alert);

  res.json({ ok: true, anomalyActive: active });
});

// GET /api/thingspeak/status — config and connection status
app.get('/api/thingspeak/status', (_req, res) => {
  res.json({
    configured: tsConfigured,
    channelId:  tsConfigured ? CHANNEL_ID : null,
    machineAlphaSource: state.machines['machine_alpha']?.source || 'simulator',
    lastUpdate: state.machines['machine_alpha']?.lastThingSpeakUpdate || null
  });
});

// GET /api/status  — health check
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    thingSpeak: tsConfigured,
    anomalyActive: state.anomalyActive,
    machineCount: Object.keys(state.machines).length,
    alertCount: alertLog.length,
    sseClients: sseClients.size,
    uptime: process.uptime()
  });
});

// ── SSE Stream Endpoint ───────────────────────────────────────────────────────
app.get('/api/sse/telemetry', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  res.write(`event: telemetry\ndata: ${JSON.stringify({
    machines:  getMachinesArray(),
    newAlerts: [],
    timestamp: new Date().toISOString()
  })}\n\n`);

  res.write(`event: alert_snapshot\ndata: ${JSON.stringify(alertLog)}\n\n`);

  sseClients.add(res);
  req.on('close', () => { sseClients.delete(res); });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`IIoT Backend listening on http://localhost:${PORT}`);
  console.log(`  Machines        : GET  /api/machines`);
  console.log(`  Alerts          : GET  /api/alerts`);
  console.log(`  Anomaly         : POST /api/simulate/anomaly  { active: true|false }`);
  console.log(`  SSE stream      : GET  /api/sse/telemetry`);
  console.log(`  Status          : GET  /api/status`);
  console.log(`  ThingSpeak info : GET  /api/thingspeak/status`);
});
