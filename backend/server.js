require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { tick, setAnomaly, getMachinesArray, state } = require('./simulator');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// ── Alert log (kept server-side) ─────────────────────────────────────────────
const MAX_ALERTS = 100;
let alertLog = [
  {
    id: 'init-1',
    level: 'info',
    message: 'Backend API server started. Telemetry simulator active.',
    timestamp: new Date().toISOString(),
    source: 'IIoT Backend',
    acknowledged: false
  },
  {
    id: 'init-2',
    level: 'info',
    message: 'All 3 machine telemetry channels initialized. SSE stream ready.',
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
    source: 'GCP Test Suite',
    acknowledged: false
  };
  pushAlert(alert);
  broadcastSSE('new_alert', alert);

  res.json({ ok: true, anomalyActive: active });
});

// GET /api/status  — health check
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    anomalyActive: state.anomalyActive,
    machineCount: Object.keys(state.machines).length,
    alertCount: alertLog.length,
    sseClients: sseClients.size,
    uptime: process.uptime()
  });
});

// ── SSE Stream Endpoint ───────────────────────────────────────────────────────
// GET /api/sse/telemetry
// Frontend connects once; server pushes 'telemetry' events every 1.5 s.
app.get('/api/sse/telemetry', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  // Send current snapshot immediately so the UI isn't blank on connect
  res.write(`event: telemetry\ndata: ${JSON.stringify({
    machines:  getMachinesArray(),
    newAlerts: [],
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Send full alert log once on connect
  res.write(`event: alert_snapshot\ndata: ${JSON.stringify(alertLog)}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`IIoT Backend listening on http://localhost:${PORT}`);
  console.log(`  Machines   : GET  /api/machines`);
  console.log(`  Alerts     : GET  /api/alerts`);
  console.log(`  Anomaly    : POST /api/simulate/anomaly  { active: true|false }`);
  console.log(`  SSE stream : GET  /api/sse/telemetry`);
  console.log(`  Status     : GET  /api/status`);
});
