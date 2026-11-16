// eink-calendar-card v23 — 800x480 1-bit layouts for e-paper (home / week / weather)
const COND = {'clear-night':'weather-night',cloudy:'weather-cloudy',exceptional:'alert-circle-outline',fog:'weather-fog',hail:'weather-hail',lightning:'weather-lightning','lightning-rainy':'weather-lightning-rainy',partlycloudy:'weather-partly-cloudy',pouring:'weather-pouring',rainy:'weather-rainy',snowy:'weather-snowy','snowy-rainy':'weather-snowy-rainy',sunny:'weather-sunny',windy:'weather-windy','windy-variant':'weather-windy-variant'};
const CLABEL = {'clear-night':'Clear',partlycloudy:'Partly cloudy','lightning-rainy':'Storms','snowy-rainy':'Sleet','windy-variant':'Windy'};
const WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const condLabel = c => CLABEL[c] || cap((c || '').replace(/-/g, ' '));
const icon = (c, cls = '') => `<ha-icon class="${cls}" icon="mdi:${COND[c] || 'weather-cloudy'}"></ha-icon>`;
const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const fmtT = (d, showAp = true, pad = false) => { let h = d.getHours(); const m = d.getMinutes(), ap = h < 12 ? 'a' : 'p'; h = h % 12 || 12; return h + (m || pad ? ':' + String(m).padStart(2, '0') : '') + (showAp ? ap : ''); };
const parseT = t => t.date ? new Date(...t.date.split('-').map((v, i) => i === 1 ? v - 1 : +v)) : new Date(t.dateTime);
const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const compass = b => b == null ? '' : DIRS[Math.round(b / 22.5) % 16];
const num = (v, d = 0) => v == null ? '–' : (+v).toFixed(d).replace(/\.0+$/, '');
const STOP = new Set(['the','and','for','with','day','fall','spring','event']);
const words = t => new Set(t.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w)));
const sim = (a, b) => { const A = words(a), B = words(b); let n = 0; A.forEach(w => B.has(w) && n++); return n / Math.max(1, Math.min(A.size, B.size)); };
const deg = v => v == null ? '–' : Math.round(v) + '°';

// Icons for major holidays (first match wins), used on calendars with holiday_icons: true
const HOLIDAYS = [
  [/thanksgiving/i, 'food-turkey'], [/christmas eve|christmas day|^christmas/i, 'pine-tree'],
  [/independence day|fourth of july|july 4/i, 'firework'], [/new year/i, 'party-popper'],
  [/halloween/i, 'halloween'], [/valentine/i, 'heart'], [/st\.? patrick/i, 'clover'],
  [/easter/i, 'egg-easter'], [/mother'?s day/i, 'flower'], [/father'?s day/i, 'tie'],
  [/hanukkah|chanukah/i, 'candle'], [/passover|rosh hashanah|yom kippur/i, 'star-david'],
  [/diwali|deepavali/i, 'oil-lamp'], [/lunar new year|chinese new year/i, 'firework'],
  [/martin luther king/i, 'microphone-variant'], [/labor day/i, 'hammer-wrench'],
  [/memorial day|veterans day/i, 'flag-variant'], [/election day/i, 'vote'],
  [/groundhog/i, 'weather-sunny'], [/earth day/i, 'earth'], [/black friday/i, 'tag'],
];
const holidayIcon = t => { const h = HOLIDAYS.find(([re]) => re.test(t)); return h ? 'mdi:' + h[1] : null; };

// Font presets: `sans` for headings/weather, `cond` (+ optional width) for schedule lists
const FONTS = {
  sofia: { url: 'https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400;500;700&family=Sofia+Sans+Extra+Condensed:wght@400;500;600;700&display=block',
    sans: '"Sofia Sans"', cond: '"Sofia Sans Extra Condensed"', stretch: 'normal' },
  roboto: { url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,400..800&display=block',
    sans: 'Roboto', cond: '"Roboto Flex"', stretch: '40%' },
};
// @font-face is ignored inside shadow roots, so the font CSS goes in the document head once per preset
function loadFonts(f) {
  let l = [...document.head.querySelectorAll('link[data-eink-font]')].find(l => l.href === f.url);
  if (!l) { l = document.createElement('link'); l.rel = 'stylesheet'; l.href = f.url; l.dataset.einkFont = '1'; document.head.appendChild(l); }
  // fonts.load() resolves empty until the @font-face rules exist, so wait for the stylesheet first
  const sheet = l.sheet ? Promise.resolve() : new Promise(r => { l.addEventListener('load', r); l.addEventListener('error', r); });
  const wait = sheet.then(() => Promise.all([`400 20px ${f.sans}`, `700 20px ${f.sans}`, `600 20px ${f.cond}`, `700 20px ${f.cond}`].map(x => document.fonts.load(x)))).catch(() => {});
  return Promise.race([wait, new Promise(r => setTimeout(r, 4000))]);
}

const css = f => { const SANS = `${f.sans},Roboto,Arial,sans-serif`, COND_F = `${f.cond},Roboto,Arial,sans-serif`; return `
:host{display:block}
.wrap{width:800px;height:480px;overflow:hidden;background:#fff;color:#000;font-family:${SANS};display:flex;flex-direction:column;-webkit-font-smoothing:none;box-sizing:border-box}
.hdr{flex:none;height:60px;background:#000;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 20px}
.hdr .t{font-size:30px;font-weight:700}.hdr .t span{font-weight:400}
.hdr .s{font-size:24px;font-weight:700;display:flex;align-items:center;gap:8px}
.hdr ha-icon{--mdc-icon-size:32px;color:#fff}
.body{flex:1;min-height:0;display:flex}
.col{display:flex;flex-direction:column;min-height:0;padding:12px 18px}
.side{width:300px;flex:none;display:flex;flex-direction:column;min-height:0}
.h2{flex:none;font-size:19px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:3px solid #000;padding-bottom:4px;margin-bottom:10px}
/* time column sized by the browser: subgrid rows share one max-content column, so it re-fits when fonts load */
.list{flex:1;min-height:0;overflow:hidden;font-family:${COND_F};font-stretch:${f.stretch};display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;align-content:start}
.ev{grid-column:1/-1;display:grid;grid-template-columns:subgrid;align-items:baseline;margin-bottom:10px;line-height:1.15}
.tm{text-align:right;font-weight:700;white-space:nowrap}
.ti{min-width:0;font-weight:600;letter-spacing:.3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ad .tm{display:none}.ad .ti{grid-column:1/-1;border-left:5px solid #000;padding-left:8px;font-weight:700}
.more,.none{grid-column:1/-1}.more{font-weight:700;font-size:18px}
.none{font-size:22px}
.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr)}
.cell{display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;border-right:2px solid #000;border-bottom:2px solid #000}
.cell:nth-child(4n){border-right:0}.cell:nth-child(n+5){border-bottom:0}
.dh{flex:none;display:flex;justify-content:space-between;font-size:18px;font-weight:700;padding:4px 8px;border-bottom:2px solid #000}
.dh span{font-weight:400}
.cell.now .dh{background:#000;color:#fff}
.cell .list{padding:6px 6px 0;column-gap:5px}
.cell .ev{font-size:18px;margin-bottom:4px}.cell .ti{-webkit-line-clamp:1;word-break:break-all}
.cell .ad .ti{border-left-width:4px;padding-left:5px}.cell .more{font-size:16px}.cell .none{font-size:17px}
.wx{flex:1;min-height:0;display:flex;flex-direction:column}
.cur{flex:none;height:176px;display:flex;align-items:center;border-bottom:3px solid #000;padding:0 20px;gap:24px}
.wnow{display:flex;align-items:center;gap:14px;width:330px;flex:none}
.wnow ha-icon{--mdc-icon-size:104px}
.big{font-size:84px;font-weight:700;line-height:.95}
.cd{font-size:24px;font-weight:700}
.kvs{flex:1;display:grid;grid-template-columns:1fr 1fr;column-gap:22px;row-gap:12px}
.kv{display:flex;justify-content:space-between;font-size:21px;border-bottom:1px solid #000;padding-bottom:3px}
.kv b{font-weight:700}.kv:nth-last-child(-n+2){border-bottom:0}
.hrs{flex:none;height:104px;display:flex;border-bottom:3px solid #000}
.hr{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.hr .n{font-size:16px;font-weight:700}.hr ha-icon{--mdc-icon-size:30px}.hr .hi{font-size:21px;font-weight:700}.hr .p{font-size:13px;font-weight:700}
.fc{flex:1;min-height:0;display:flex}
.fd{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-right:2px solid #000}
.fd:last-child{border-right:0}
.fd .n{font-size:18px;font-weight:700}.fd ha-icon{--mdc-icon-size:36px}
.hl2{font-size:19px}.hl2 b{font-size:22px}.fd .p{font-size:14px;font-weight:700}
.ci{--mdc-icon-size:.8em;display:inline-flex;align-items:center;justify-content:center;width:.8em;height:.8em;margin-right:.25em;vertical-align:middle;position:relative;top:-.1em}
/* home view: timeline left, next two days right */
.hdr .s .hl{font-weight:700}.hdr .s .lo{font-weight:400}.hdr .s .rp{font-weight:400;font-size:20px;margin-left:4px}
.tl{flex:1;min-width:0;display:flex;flex-direction:column;border-right:3px solid #000}
.adr{flex:none;display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 14px 8px 14px;border-bottom:2px solid #000;font-family:${COND_F};font-stretch:${f.stretch};font-size:22px;font-weight:700;max-height:76px;overflow:hidden}
.adr .c{border-left:5px solid #000;padding-left:7px;line-height:1.1;white-space:nowrap}
.tg{flex:1;min-height:0;position:relative;overflow:hidden;font-family:${COND_F};font-stretch:${f.stretch}}
.tg .hl0{position:absolute;left:44px;right:0;border-top:1px dotted #000}
.tg .hl0.sq{border-top-style:solid}
.tg .lb{position:absolute;left:0;width:36px;text-align:right;font-family:${SANS};font-size:15px;font-weight:700;transform:translateY(-50%);line-height:1}
.b{position:absolute;box-sizing:border-box;overflow:hidden;line-height:1.08;padding:3px 6px 0 7px;background:#fff}
.b .t{font-weight:700;font-size:17px;white-space:nowrap}
.b .n{font-weight:600;font-size:21px;letter-spacing:.2px;overflow:hidden}
.b.sh{display:flex;align-items:baseline;gap:6px;padding-top:1px}.b.sh .n{white-space:nowrap;text-overflow:ellipsis}
.st-box .b{border:2px solid #000;border-left-width:6px}
.st-bracket .b{border-top:3px solid #000;border-left:6px solid #000;padding-left:6px}
.st-solid .b{background:#000;color:#fff;border:2px solid #fff;border-radius:5px;padding-left:7px}.st-solid .b ha-icon{color:#fff}
.rl{position:absolute;width:6px;background:#000}
.rk{position:absolute;height:0;border-top:2px solid #000}
.rt{position:absolute;right:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1;font-size:21px;font-weight:600;background:#fff;padding-right:2px}
.rt .t{font-weight:700;font-size:18px;margin-right:6px}
.bz{position:absolute;left:39px;width:4px;background:#000}
/* current-time marker: a small pointer at the far left of the hour labels, no line */
.b{z-index:1}
.nt{position:absolute;left:0;width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid #000;transform:translateY(-50%);z-index:3}
.empty{position:absolute;left:44px;right:0;top:45%;text-align:center;font-size:24px;font-weight:600}
.nd{flex:1;min-height:0;padding-top:10px;padding-bottom:2px}.nd+.nd{border-top:3px solid #000}
.nd .h2{border-bottom-width:1px;padding-bottom:5px;margin-bottom:8px}.nd .ev{font-size:20px;margin-bottom:5px}.nd .ti{-webkit-line-clamp:1;word-break:break-all}.nd .list{column-gap:8px}
`; };

class EinkCalendarCard extends HTMLElement {
  setConfig(c) {
    if (!c.calendars && c.view !== 'weather') throw new Error('calendars required');
    this._c = { view: 'home', mask: [], mask_label: 'Appointment', ...c };
    this._c.calendars = (c.calendars || []).map(x => typeof x === 'string' ? { entity: x } : x);
    this._last = 0;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._font = FONTS[c.font] || FONTS.sofia;
    this.shadowRoot.innerHTML = `<style>${css(this._font)}</style><div class="wrap"></div>`;
  }
  set hass(h) {
    this._hass = h;
    if (Date.now() - this._last > 60000) { this._last = Date.now(); this._load(); }
  }
  getCardSize() { return 10; }
  // `date` in config or ?date=YYYY-MM-DD in the URL previews another day (time of day stays current)
  _now() {
    const q = this._c.date || new URLSearchParams(location.search).get('date'), n = new Date();
    if (!q) return n;
    const [y, m, d] = q.split('-').map(Number), x = new Date(n);
    x.setFullYear(y, m - 1, d);
    return x;
  }

  async _load() {
    const c = this._c, h = this._hass, start = midnight(this._now()), end = addDays(start, 9);
    const qs = `start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
    const lists = await Promise.all(c.calendars.map(cal =>
      h.callApi('GET', `calendars/${cal.entity}?${qs}`).then(evs => evs.map(e => this._norm(e, cal))).catch(() => [])));
    this._events = lists.flat().sort((a, b) => (b.allDay - a.allDay) || (a.start - b.start));
    if (c.weather) {
      const nws = c.forecast, hrSrc = nws || c.weather;
      [this._fc, this._tw, this._hr] = await Promise.all([
        this._forecast(c.weather, 'daily').catch(() => null),
        nws ? this._forecast(nws, 'twice_daily').catch(() => null) : null,
        c.view === 'weather' ? this._forecast(hrSrc, 'hourly').catch(() => null) : null]);
    }
    await (this._fonts || (this._fonts = loadFonts(this._font)));
    this._render();
  }
  _norm(e, cal) {
    let title = e.summary || '(untitled)';
    if (c_mask(this._c.mask, title)) title = this._c.mask_label;
    if (cal.prefix) title = `${cal.prefix} ${title}`;
    return { title, raw: e.summary || '', cal: cal.entity, dedupe: !!cal.dedupe, busy: !!cal.busy, icon: (cal.holiday_icons && holidayIcon(e.summary || '')) || cal.icon, allDay: !!e.start.date, start: parseT(e.start), end: parseT(e.end) };
  }
  _forecast(entity, type) {
    return new Promise((res, rej) => {
      let unsub, done = false;
      const t = setTimeout(() => { done = true; unsub && unsub(); rej(); }, 5000);
      this._hass.connection.subscribeMessage(m => {
        if (done) return; done = true; clearTimeout(t); res(m.forecast || []); unsub && unsub();
      }, { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: entity })
        .then(u => { unsub = u; if (done) u(); }).catch(rej);
    });
  }
  _day(d) {
    const ds = midnight(d), de = addDays(ds, 1);
    const evs = this._events.filter(e => !e.busy && e.start < de && (e.end > ds || e.start >= ds));
    // On dedupe calendars, hide (a) an all-day item when the same calendar has a timed event that day with a
    // near-identical title, and (b) an event that a non-dedupe calendar already shows at exactly the same time
    const dup = e => e.allDay
      ? evs.some(t => !t.allDay && t.cal === e.cal && sim(e.raw, t.raw) >= 0.75)
      : evs.some(t => !t.allDay && !t.dedupe && t.cal !== e.cal && +t.start === +e.start && +t.end === +e.end);
    return evs.filter(e => !(e.dedupe && dup(e)));
  }
  // Merge Met.no daily (amounts, UV) with NWS twice-daily (official highs/lows, precip chance)
  _daily() {
    const met = this._fc || [], nws = this._tw || [], out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(this._now(), i), on = x => sameDay(new Date(x.datetime), d);
      const m = met.find(on), day = nws.find(p => p.is_daytime && on(p)), night = nws.find(p => !p.is_daytime && on(p));
      if (!m && !day && !night) continue;
      const pops = [day, night].filter(p => p && p.precipitation_probability != null).map(p => p.precipitation_probability);
      out.push({ date: d, hi: day ? day.temperature : m && m.temperature, lo: night ? night.temperature : m && m.templow,
        cond: (day || night || m).condition, uv: m && m.uv_index, amt: m && m.precipitation,
        pop: pops.length ? Math.max(...pops) : m && m.precipitation_probability });
    }
    return out;
  }
  _fcFor(d) { return (this._dd || []).find(f => sameDay(f.date, d)); }
  _rain(f, min = 0) {
    if (!f) return '';
    const pu = (this._hass.states[this._c.weather] || { attributes: {} }).attributes.precipitation_unit || 'in';
    const amt = f.amt > 0 ? `${num(f.amt, pu === 'in' ? 2 : 1)} ${pu}` : '';
    return [f.pop != null && f.pop >= min ? `${f.pop}%` : '', amt].filter(Boolean).join(' · ');
  }
  // o: { ap: show a/p, pad: always show :00, range: show end time }
  _row(e, d, o = {}) {
    const ap = o.ap !== false, t = x => fmtT(x, ap, o.pad);
    let tm;
    if (e.allDay) tm = 'ALL DAY';
    else if (!sameDay(e.start, d)) tm = 'cont.';
    else if (o.range && e.end > e.start && sameDay(e.end, d)) tm = `${t(e.start)}–${t(e.end)}`;
    else tm = t(e.start);
    return `<div class="ev${e.allDay ? ' ad' : ''}"><div class="tm">${tm}</div><div class="ti">${e.icon ? `<ha-icon class="ci" icon="${esc(e.icon)}"></ha-icon>` : ''}${esc(e.title)}</div></div>`;
  }
  _list(evs, d, empty = 'Nothing scheduled', o = {}) {
    return `<div class="list">${evs.length ? evs.map(e => this._row(e, d, o)).join('') : `<div class="none">${empty}</div>`}</div>`;
  }

  _render() {
    const now = this._now(), v = this._c.view;
    this._dd = this._daily();
    const html = v === 'week' ? this._week(now) : v === 'weather' ? this._weather(now) : this._home(now);
    this.shadowRoot.querySelector('.wrap').innerHTML = html;
    requestAnimationFrame(() => { this._timeline(); this._fit(); });
    setTimeout(() => this._fit(), 400);
    document.fonts.ready.then(() => setTimeout(() => this._fit(), 50));
  }
  // Home view: today as an hour grid on the left, the next two days as lists on the right
  _home(now) {
    const c = this._c, f = this._fcFor(now), evs = this._day(now), ad = evs.filter(e => e.allDay);
    const ds = midnight(now), de = addDays(ds, 1);
    // busy-only calendars (availability, no titles) become a bar in the hour-label margin
    this._tl = { day: now, evs: evs.filter(e => !e.allDay), busy: this._events.filter(e => e.busy && !e.allDay && e.start < de && e.end > ds
      && !evs.some(t => +t.start === +e.start && +t.end === +e.end)) }; // skip blocks that are a family event already shown
    const rain = f && f.pop > 10 ? `${f.pop}% rain` : '';
    const wx = f ? `<div class="s">${icon(f.cond)}<span class="hl">${deg(f.hi)}</span><span class="lo">/ ${deg(f.lo)}</span>${rain ? `<span class="rp">· ${rain}</span>` : ''}</div>` : '';
    const side = [1, 2].map(i => {
      const d = addDays(now, i), fd = this._fcFor(d);
      return `<div class="col nd"><div class="h2">${WD[d.getDay()]}${fd ? ` · ${deg(fd.hi)}/${deg(fd.lo)}` : ''}</div>${this._list(this._day(d), d, 'Nothing scheduled', { ap: false, pad: true })}</div>`;
    }).join('');
    return `<div class="hdr"><div class="t">${WD[now.getDay()]} <span>${MO[now.getMonth()]} ${now.getDate()}</span></div>${wx}</div>
      <div class="body">
        <div class="tl st-${c.timeline_style || 'box'}">${ad.length ? `<div class="adr">${ad.map(e => `<div class="c">${this._ico(e)}${esc(e.title)}</div>`).join('')}</div>` : ''}<div class="tg"></div></div>
        <div class="side">${side}</div>
      </div>`;
  }
  _ico(e) { return e.icon ? `<ha-icon class="ci" icon="${esc(e.icon)}"></ha-icon>` : ''; }
  // Lays out the hour grid once the box size is known. Axis 'elastic' shrinks hours with no events.
  _timeline() {
    const g = this.shadowRoot.querySelector('.tg');
    if (!g || !this._tl) return;
    const c = this._c, style = c.timeline_style || 'box', elastic = (c.timeline_axis || 'elastic') === 'elastic';
    const day = midnight(this._tl.day), mins = d => (d - day) / 60000;
    const ev = this._tl.evs.map(e => ({ e, s: Math.max(0, mins(e.start)), en: Math.min(1440, mins(e.end)) }));
    const [d0, d1] = c.hours || [8, 20];
    let h0 = d0, h1 = d1;
    const bz = (this._tl.busy || []).map(b => ({ s: Math.max(0, mins(b.start)), en: Math.min(1440, mins(b.end)) }));
    const nm = mins(this._now());
    // keep the current time on the grid (e.g. before school), within reason
    if (c.now_marker !== false && nm >= 360 && nm < h0 * 60) h0 = Math.floor(nm / 60);
    [...ev, ...bz].forEach(x => { h0 = Math.min(h0, Math.floor(x.s / 60)); h1 = Math.max(h1, Math.ceil(Math.max(x.en, x.s + 30) / 60)); });
    h1 = Math.min(h1, 24);
    const busy = h => ev.some(x => x.s < (h + 1) * 60 && Math.max(x.en, x.s + 30) > h * 60);
    const W = [];
    for (let h = h0; h < h1; h++) W.push(!elastic || busy(h) ? 1 : (c.compress ?? 0.4));
    const PT = 10, PB = 6, H = g.clientHeight - PT - PB, unit = H / W.reduce((a, b) => a + b, 0);
    const Y = [PT];
    W.forEach(w => Y.push(Y[Y.length - 1] + w * unit));
    const y = m => { const hh = m / 60 - h0, i = Math.max(0, Math.min(W.length - 1, Math.floor(hh))); return Y[i] + (hh - i) * W[i] * unit; };
    let html = '', lastLb = -99;
    const showNow = c.now_marker !== false && nm >= h0 * 60 && nm <= h1 * 60, ny = showNow ? y(nm) : -99;
    for (let h = h0; h <= h1; h++) {
      const yy = Y[h - h0];
      html += `<div class="hl0${h === 12 ? ' sq' : ''}" style="top:${yy}px"></div>`;
      if (h < h1 && yy - lastLb >= 17) { html += `<div class="lb" style="top:${yy}px">${h % 12 || 12}</div>`; lastLb = yy; }
    }
    // Overlap layout (FullCalendar-style): cluster overlapping events, first-fit columns, expand right into free columns
    const MIN = style === 'rail' ? 8 : 28;
    const it = ev.map(x => { const top = y(x.s); return { ...x, top, bot: Math.max(y(x.en), top + MIN) }; })
      .sort((a, b) => a.top - b.top || b.bot - a.bot);
    const clusters = [];
    let cl = null, end = 0;
    it.forEach(x => { if (!cl || x.top >= end - 0.5) { cl = []; clusters.push(cl); end = x.bot; } else end = Math.max(end, x.bot); cl.push(x); });
    clusters.forEach(cl => {
      const cols = [];
      cl.forEach(x => { let k = cols.findIndex(b => b <= x.top + 0.5); if (k < 0) { k = cols.length; cols.push(0); } cols[k] = x.bot; x.col = k; });
      cl.forEach(x => {
        x.n = cols.length; x.span = 1;
        while (x.col + x.span < x.n && !cl.some(o => o.col === x.col + x.span && o.top < x.bot - 0.5 && o.bot > x.top + 0.5)) x.span++;
      });
    });
    const t = d => fmtT(d, false, true);
    const range = x => `${sameDay(x.e.start, day) ? t(x.e.start) : '…'}–${sameDay(x.e.end, day) ? t(x.e.end) : '…'}`;
    const L = 46, R = 6, Wd = g.clientWidth - L - R;
    if (style === 'rail') {
      const lanes = Math.max(1, ...it.map(x => x.n)), LW = 7, LG = 5, TX = L + 4 + lanes * (LW + LG) + 4;
      let floor = 0;
      it.forEach(x => {
        const lx = L + 4 + x.col * (LW + LG);
        // label sits on the bar's start tick; when pushed down by a previous label the tick follows it (within the bar)
        const ty = Math.max(x.top - 11, floor), ky = Math.min(Math.max(ty + 11, x.top), x.bot - 2);
        floor = ty + 24;
        html += `<div class="rl" style="top:${x.top}px;height:${x.bot - x.top}px;left:${lx}px"></div><div class="rk" style="top:${ky}px;left:${lx}px;width:${TX - lx}px"></div>`;
        html += `<div class="rt" style="top:${ty}px;left:${TX + 4}px"><span class="t">${range(x)}</span>${this._ico(x.e)}${esc(x.e.title)}</div>`;
      });
    } else {
      it.forEach(x => {
        const left = L + Wd * x.col / x.n, w = Wd * x.span / x.n - (x.col + x.span < x.n ? 4 : 0), h = x.bot - x.top - 2;
        const sh = h < 44, lines = Math.max(1, Math.floor((h - 24) / 23));
        html += `<div class="b${sh ? ' sh' : ''}" style="top:${x.top}px;height:${h}px;left:${left}px;width:${w}px">`
          + `<div class="t">${sh ? (sameDay(x.e.start, day) ? t(x.e.start) : '…') : range(x)}</div>`
          + `<div class="n"${sh ? '' : ` style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${lines}"`}>${this._ico(x.e)}${esc(x.e.title)}</div></div>`;
      });
    }
    bz.forEach(({ s, en }) => {
      if (en > s) html += `<div class="bz" style="top:${y(s)}px;height:${Math.max(3, y(en) - y(s) - 1)}px"></div>`;
    });
    if (showNow) html += `<div class="nt" style="top:${ny}px"></div>`;
    if (!it.length) html += `<div class="empty">Nothing scheduled</div>`;
    g.innerHTML = html;
  }
  _week(now) {
    const end = addDays(now, 7);
    const cells = [...Array(8)].map((_, i) => {
      const d = addDays(now, i), f = this._fcFor(d);
      const evs = this._day(d);
      return `<div class="cell${i ? '' : ' now'}"><div class="dh">${WD[d.getDay()].slice(0, 3)} ${d.getDate()}<span>${f ? deg(f.hi) + '/' + deg(f.lo) : ''}</span></div>${this._list(evs, d, '—', { ap: false })}</div>`;
    }).join('');
    return `<div class="hdr"><div class="t">This week <span>${MO[now.getMonth()].slice(0, 3)} ${now.getDate()} – ${MO[end.getMonth()].slice(0, 3)} ${end.getDate()}</span></div></div><div class="grid">${cells}</div>`;
  }
  _weather(now) {
    const s = this._hass.states[this._c.weather];
    if (!s) return `<div class="hdr"><div class="t">Weather</div></div><div class="none" style="padding:20px">No weather entity</div>`;
    const a = s.attributes, f0 = this._fcFor(now), sun = this._hass.states['sun.sun'];
    const pu = a.precipitation_unit || 'in', wu = a.wind_speed_unit || 'mph';
    const rain = v => v > 0 ? `${num(v, pu === 'in' ? 2 : 1)} ${pu}` : '';
    const st = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
    const sunT = k => sun && sun.attributes[k] ? fmtT(new Date(sun.attributes[k])) : '–';
    const rainToday = this._rain(f0) || 'None';
    const hrRain = h => h.precipitation_probability >= 20 ? `${h.precipitation_probability}%` : rain(h.precipitation);
    const hrs = (this._hr || []).filter(h => new Date(h.datetime) > now).filter((_, i) => i % 2 === 0).slice(0, 8);
    const days = this._dd;
    // every hour gets a precip line (blank if none) when any hour has one, so icons and temps line up across the row
    const anyP = hrs.some(h => hrRain(h));
    return `<div class="hdr"><div class="t">Weather <span>${WD[now.getDay()]}, ${MO[now.getMonth()]} ${now.getDate()}</span></div>
        <div class="s">${f0 ? `High ${deg(f0.hi)} · Low ${deg(f0.lo)}` : ''}</div></div>
      <div class="wx">
        <div class="cur">
          <div class="wnow">${icon(s.state)}<div><div class="big">${deg(a.temperature)}</div><div class="cd">${esc(condLabel(s.state))}</div></div></div>
          <div class="kvs">
            ${st('Rain', rainToday)}${st('Humidity', `${num(a.humidity)}%`)}
            ${st('Wind', `${num(a.wind_speed)} ${wu} ${compass(a.wind_bearing)}`)}${st('UV index', num(f0 && f0.uv != null ? f0.uv : a.uv_index))}
            ${st('Sunrise', sunT('next_rising'))}${st('Sunset', sunT('next_setting'))}
          </div>
        </div>
        <div class="hrs">${hrs.map(h => `<div class="hr"><div class="n">${fmtT(new Date(h.datetime))}</div>${icon(h.condition)}<div class="hi">${deg(h.temperature)}</div>${anyP ? `<div class="p">${hrRain(h) || '&nbsp;'}</div>` : ''}</div>`).join('')}</div>
        <div class="fc">${days.map((f, i) => `<div class="fd"><div class="n">${i ? WD[f.date.getDay()].slice(0, 3) : 'Today'}</div>${icon(f.cond)}<div class="hl2"><b>${deg(f.hi)}</b> ${deg(f.lo)}</div><div class="p">${this._rain(f, 10) || '&nbsp;'}</div></div>`).join('')}</div>
      </div>`;
  }
  // Split height between two stacked areas by content (week rows; the home view's two side days),
  // so a busy one can borrow space from a light one
  _balance() {
    // scrollHeight never drops below the box height, so measure the last row's bottom edge instead
    const content = l => { const k = l.lastElementChild; return k ? k.getBoundingClientRect().bottom - l.getBoundingClientRect().top + 8 : 0; };
    const split = (H, a, b, MIN) => a + b <= H ? a + (H - a - b) / 2
      : a < b ? Math.max(MIN, Math.min(a, H - MIN)) : H - Math.max(MIN, Math.min(b, H - MIN));
    const g = this.shadowRoot.querySelector('.grid');
    if (g) {
      const cells = [...g.children];
      const need = r => Math.max(...cells.slice(r * 4, r * 4 + 4).map(c => c.querySelector('.dh').offsetHeight + content(c.querySelector('.list'))));
      g.style.gridTemplateRows = `${Math.round(split(g.clientHeight, need(0), need(1), 120))}px 1fr`;
    }
    const nd = [...this.shadowRoot.querySelectorAll('.nd')];
    if (nd.length === 2) {
      const need = n => { const l = n.querySelector('.list'); return n.offsetHeight - l.clientHeight + content(l); };
      nd[0].style.flex = `0 0 ${Math.round(split(nd[0].parentElement.clientHeight, need(nd[0]), need(nd[1]), 110))}px`;
    }
  }
  _fit() {
    // idempotent: restore full lists, re-balance, then trim, so a pass made before fonts settled can be undone
    const lists = [...this.shadowRoot.querySelectorAll('.list')];
    lists.forEach(l => { if (l.dataset.full == null) l.dataset.full = l.innerHTML; else l.innerHTML = l.dataset.full; });
    this._balance();
    lists.forEach(l => {
      if (l.scrollHeight <= l.clientHeight + 1) return;
      const rows = [...l.querySelectorAll('.ev')];
      let more = l.querySelector('.more');
      if (!more) { more = document.createElement('div'); more.className = 'more'; more.dataset.n = 0; l.appendChild(more); }
      let n = +more.dataset.n;
      while (rows.length && l.scrollHeight > l.clientHeight + 1) { rows.pop().remove(); more.dataset.n = ++n; more.textContent = `+${n} more`; }
    });
  }
}
function c_mask(patterns, title) { return (patterns || []).some(p => new RegExp(p, 'i').test(title)); }
customElements.define('eink-calendar-card', EinkCalendarCard);
