// Local render harness: real card + mocked hass, 800x480, thresholded to 1-bit.
// usage: node harness/render.js <card.js> <outdir> <jobs.json>
// jobs: [{ name, date: 'MM-DD', time?: 'HH:MM', cfg: { view, ... } }]  (dates are in 2026; see data.js)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const mdi = require('@mdi/js');
const { events, daily, pop } = require('./data.js');
const [cardPath, outDir, jobsPath] = process.argv.slice(2);
const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
const H = __dirname;

// only embed the icons the card can use (weather, holiday and calendar icons)
const MDI = {};
for (const [k, v] of Object.entries(mdi)) if (/^mdi(Weather|School|Campfire|Flag|Food|Pine|Firework|Party|Halloween|Heart|Clover|Egg|Flower|Tie|Candle|Star|Oil|Microphone|Hammer|Vote|Earth|Tag|Alert)/.test(k)) MDI[k] = v;
const twice = daily.flatMap(d => {
  const k = d.datetime.slice(5, 10), p = pop[k] ?? 5;
  return [{ datetime: `2026-${k}T06:00:00-05:00`, is_daytime: true, temperature: d.temperature, condition: d.condition, precipitation_probability: p },
          { datetime: `2026-${k}T18:00:00-05:00`, is_daytime: false, temperature: d.templow, condition: d.condition, precipitation_probability: p }];
});
const card = fs.readFileSync(cardPath, 'utf8');

const page = cfg => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff}</style></head><body><script>
const MDI = ${JSON.stringify(MDI)};
customElements.define('ha-icon', class extends HTMLElement {
  static get observedAttributes() { return ['icon']; }
  connectedCallback() { this.r(); } attributeChangedCallback() { this.r(); }
  r() { const n = (this.getAttribute('icon') || '').replace('mdi:', ''), k = 'mdi' + n.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
    this.style.display = 'inline-flex';
    this.innerHTML = '<svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)"><path fill="currentColor" d="' + (MDI[k] || '') + '"/></svg>'; }
});
</script><script type="module">
${card}
const HR = Array.from({length: 16}, (_, i) => { const d = new Date(Date.now() + (i + 1) * 3600e3); d.setMinutes(0, 0, 0); const p = [0, 0, 24, 0, 46, 0, 33, 0, 30, 0, 24, 0, 5, 0, 0, 0][i]; return { datetime: d.toISOString(), temperature: 64 + (i > 10 ? i - 8 : 0), condition: p > 10 ? 'rainy' : 'cloudy', precipitation_probability: p }; });
const EV = ${JSON.stringify(events)}, DAILY = ${JSON.stringify(daily)}, TW = ${JSON.stringify(twice)};
const pt = t => t.date ? new Date(t.date + 'T00:00:00') : new Date(t.dateTime);
const hass = {
  states: { 'weather.forecast_home': { state: 'partlycloudy', attributes: { temperature: 70, humidity: 60, wind_speed: 5, wind_bearing: 90, precipitation_unit: 'in', wind_speed_unit: 'mph' } },
            'sun.sun': { state: 'above_horizon', attributes: {} } },
  callApi: async (m, p) => { const [ent, qs] = p.replace('calendars/', '').split('?'), q = new URLSearchParams(qs), s = new Date(q.get('start')), e = new Date(q.get('end'));
    return (EV[ent] || []).filter(x => pt(x.start) < e && pt(x.end) > s); },
  connection: { subscribeMessage: (cb, msg) => { setTimeout(() => cb({ forecast: msg.forecast_type === 'daily' ? DAILY : msg.forecast_type === 'twice_daily' ? TW : HR }), 0); return Promise.resolve(() => {}); } },
};
const el = document.createElement('eink-calendar-card');
el.setConfig(${JSON.stringify(cfg)});
document.body.appendChild(el);
el.hass = hass;
</script></body></html>`;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 800, height: 480 }, timezoneId: 'America/New_York' });
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body:
    `@font-face{font-family:"Sofia Sans";src:url(https://fonts.local/a.ttf);font-weight:100 900}
     @font-face{font-family:"Sofia Sans Extra Condensed";src:url(https://fonts.local/b.ttf);font-weight:100 900}` }));
  await ctx.route('https://fonts.local/a.ttf', r => r.fulfill({ path: path.join(H, 'fonts/SofiaSans.ttf'), contentType: 'font/ttf' }));
  await ctx.route('https://fonts.local/b.ttf', async r => { if (process.env.FD) await new Promise(z => setTimeout(z, +process.env.FD)); return r.fulfill({ path: path.join(H, 'fonts/SofiaSansExtraCondensed.ttf'), contentType: 'font/ttf' }); });
  const base = {
    calendars: [{ entity: 'calendar.family' }, { entity: 'calendar.school', icon: 'mdi:school', dedupe: true },
      { entity: 'calendar.scouts', icon: 'mdi:campfire', dedupe: true }, { entity: 'calendar.holidays_in_united_states', icon: 'mdi:flag-variant', holiday_icons: true }],
    weather: 'weather.forecast_home', forecast: 'weather.nws',
  };
  for (const j of jobs) {
    const pg = await ctx.newPage();
    await pg.clock.setFixedTime(new Date(`2026-${j.date}T${j.time || "07:30"}:00-05:00`));
    await pg.route('https://card.test/', r => r.fulfill({ contentType: 'text/html', body: page({ type: 'custom:eink-calendar-card', ...base, ...j.cfg }) }));
    pg.on('console', m => console.log(m.text()));
    pg.on('pageerror', e => console.error(j.name, e.message));
    await pg.goto('https://card.test/');
    await pg.waitForTimeout(+(process.env.W || 900));
    if (process.env.DBG) console.log(await pg.evaluate(() => [...document.querySelector('eink-calendar-card').shadowRoot.querySelectorAll('.nd')].map(n => { const l = n.querySelector('.list'); return [n.clientHeight, l.clientHeight, l.scrollHeight, [...l.children].map(c => c.getBoundingClientRect().height).join(',')]; })));
    const buf = await pg.screenshot({ clip: { x: 0, y: 0, width: 800, height: 480 } });
    await sharp(buf).greyscale().threshold(140).png().toFile(path.join(outDir, j.name + '.png'));
    await pg.close();
  }
  await b.close();
})();
