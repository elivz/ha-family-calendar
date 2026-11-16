# Development

The card is a single ES module with no build step: `src/eink-calendar-card.js` is what runs in HA. "Building" means
running the checks and test renders below.

## Setup

Node 22+.

```sh
npm install
npm run fonts      # downloads the two Sofia Sans variable fonts into harness/fonts/ (OFL licence)
```

## Test renders

The harness loads the real card in headless Chromium (Playwright) with a mocked `hass` object, sets a fixed clock,
renders at 800×480, and thresholds to 1-bit like the panel will show it.

```sh
npm run check      # syntax check
npm run render     # harness/jobs.json -> out/*.png
```

First time only, install the browser: `npx playwright install chromium`.

A job is `{ "name", "date": "MM-DD", "time": "HH:MM", "cfg": { ...card config } }`. Dates are in 2026 and use the
sample events in `harness/data.js` (a real month of family events, plus a fake busy-only work calendar,
`calendar.work_availability`). Edit `data.js` to add scenarios: empty days, back-to-back overlaps, long all-day lists. Set
`W=2000` to wait longer per page, `FD=1500` to delay the condensed font and test the font-load race.

`node harness/sheet.js out home "Title" out/sheet.png` builds a labelled contact sheet from files named `home-*.png`.

## How the card works

- `_load()` fetches events (`calendars/<entity>` REST API) and forecasts (`weather/subscribe_forecast`), waits for
  fonts, then `_render()`.
- `_home / _week / _weather` return the HTML for each view. The Home hour grid is laid out afterwards by `_timeline()`
  because it needs the measured box size.
- `_fit()` restores the full lists, calls `_balance()` (splits height between the two side days or the two week rows
  by content), then trims what still overflows to a "+N more" line. It is idempotent, so it can be re-run after fonts
  or layout settle.
- Fonts load through a `<link>` in `document.head`: `@font-face` is ignored inside a shadow root.
- `?date=YYYY-MM-DD` on the dashboard URL (or `date:` in the card config) previews another day.

## Conventions

- 1-bit only: no greys, no anti-aliasing reliance (`-webkit-font-smoothing:none`), borders and fills in pure black.
- No dependencies in the card. Keep it one file so deploy stays a single resource.
