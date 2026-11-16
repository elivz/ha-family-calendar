#!/usr/bin/env node
// Deploys the card (and optionally the dashboard) to Home Assistant over its WebSocket API.
//   HA_URL=http://homeassistant.local:8123 HA_TOKEN=<long-lived token> node scripts/deploy.js [--dashboard]
// The card is registered as a dashboard resource whose URL is an inline data: URI, so there is no file to
// host and no cache to bust: every deploy changes the URL. Needs Node 22+ (global WebSocket).
// NOTE: written from the HA WebSocket API docs; not yet run against a live instance.
const fs = require('fs'), path = require('path');
const { HA_URL = 'http://homeassistant.local:8123', HA_TOKEN } = process.env;
if (!HA_TOKEN) { console.error('Set HA_TOKEN to a long-lived access token (Profile > Security).'); process.exit(1); }
const withDashboard = process.argv.includes('--dashboard');
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'src/eink-calendar-card.js'));
const url = 'data:text/javascript;base64,' + code.toString('base64');
const isOurs = r => r.url.startsWith('data:text/javascript') && Buffer.from(r.url.split(',')[1] || '', 'base64').toString().includes("customElements.define('eink-calendar-card'");

const ws = new WebSocket(HA_URL.replace(/^http/, 'ws') + '/api/websocket');
let id = 0; const pending = new Map();
const call = msg => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, ...msg })); });
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.type === 'auth_required') return ws.send(JSON.stringify({ type: 'auth', access_token: HA_TOKEN }));
  if (m.type === 'auth_invalid') { console.error('Auth failed:', m.message); process.exit(1); }
  if (m.type === 'auth_ok') return run().then(() => ws.close()).catch(e => { console.error(e.message || e); process.exit(1); });
  const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
  m.success === false ? p.rej(new Error(m.error?.message || 'call failed')) : p.res(m.result);
};
ws.onerror = () => { console.error(`Could not connect to ${HA_URL}`); process.exit(1); };

async function run() {
  const resources = await call({ type: 'lovelace/resources' });
  const old = resources.find(isOurs);
  if (old) { await call({ type: 'lovelace/resources/update', resource_id: old.id, res_type: 'module', url }); console.log(`Updated resource ${old.id} (${code.length} bytes)`); }
  else { const r = await call({ type: 'lovelace/resources/create', res_type: 'module', url }); console.log(`Created resource ${r.id} (${code.length} bytes)`); }
  if (withDashboard) {
    // a git-ignored eink-panel.local.json (your real entity IDs) wins over the generic example
    const local = path.join(root, 'dashboard/eink-panel.local.json');
    const file = fs.existsSync(local) ? local : path.join(root, 'dashboard/eink-panel.json');
    console.log('Using', path.relative(root, file));
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const dashboards = await call({ type: 'lovelace/dashboards/list' });
    if (!dashboards.some(d => d.url_path === 'eink-panel'))
      await call({ type: 'lovelace/dashboards/create', url_path: 'eink-panel', title: 'E-ink panel', icon: 'mdi:calendar', show_in_sidebar: false, require_admin: false, mode: 'storage' });
    await call({ type: 'lovelace/config/save', url_path: 'eink-panel', config });
    console.log('Saved dashboard eink-panel');
  }
  console.log('Done. Hard-refresh open browsers; the next automation run re-renders the PNGs.');
}
