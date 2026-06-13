/**
 * ThingSpeak integration for machine_alpha (ESP32 + DHT22 + MPU6050).
 *
 * Expected channel field mapping (set in your ESP32 code):
 *   field1 → avgTemp      (°C)
 *   field2 → avgHumidity  (%)
 *   field3 → avgVibration (magnitude delta from baseline)
 *   field4 → equipmentHealth (%)
 *
 * Set THINGSPEAK_CHANNEL_ID and THINGSPEAK_READ_API_KEY in backend/.env
 * to enable live data. Falls back to simulator when not set.
 */

const https = require('https');

const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '';
const READ_KEY   = process.env.THINGSPEAK_READ_API_KEY || '';

function isConfigured() {
  return !!(CHANNEL_ID && READ_KEY);
}

function fetchLatestReading() {
  return new Promise((resolve, reject) => {
    const path = `/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_KEY}`;

    const req = https.request(
      { hostname: 'api.thingspeak.com', path, method: 'GET', timeout: 8000 },
      res => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.error) return reject(new Error(json.error));
            resolve({
              temperature: json.field1 != null ? parseFloat(json.field1) : null,
              humidity:    json.field2 != null ? parseFloat(json.field2) : null,
              vibration:   json.field3 != null ? parseFloat(json.field3) : null,
              health:      json.field4 != null ? parseFloat(json.field4) : null,
              timestamp:   json.created_at || new Date().toISOString()
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('timeout', () => { req.destroy(); reject(new Error('ThingSpeak request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { isConfigured, fetchLatestReading, CHANNEL_ID };
