# ha-family-calendar

A family calendar for a 7.5" 1-bit e-ink panel (Seeed reTerminal E1001, 800×480), driven by Home Assistant.

Home Assistant renders three views (Home, Week, Weather) of a custom dashboard card to PNGs every 15 minutes.
The panel (ESPHome `online_image`) downloads and displays them; the panel does no layout work.

```
Google / ICS calendars ─┐
NWS + Met.no weather ───┼─► eink-calendar-card (HA dashboard "eink-panel")
                        │         │  screenshot, 800×480, 1-bit  (Puppet app)
                        │         ▼
                        │   /config/www/eink-RANDOM/{home,week,weather}.png   (Downloader, every 15 min)
                        │         │
                        └─────────┴──► E1001 fetches /local/eink-RANDOM/*.png
```

## Views

- **Home**: today as an hour grid (events as blocks, overlap handled FullCalendar-style, current-time arrow, optional
  availability bar for a busy-only calendar), weather and rain chance in the header, next two days as lists on the right.
- **Week**: 8-day grid with highs/lows.
- **Weather**: current conditions, next hours, 7-day forecast.

## Layout

| Path | What |
|---|---|
| `src/eink-calendar-card.js` | The whole card (one dependency-free ES module). This is the source of truth. |
| `dashboard/eink-panel.json` | The `eink-panel` dashboard (three card views) |
| `ha/automation.yaml` | Refresh automation: sync calendar, render PNGs |
| `scripts/deploy.js` | Pushes the card (and dashboard) to HA over its WebSocket API |
| `esphome/` | Panel firmware ([setup guide](docs/panel.md)) |
| `harness/` | Local renderer: the real card with mocked HA data, thresholded to 1-bit PNGs |
| `docs/` | [deploy](docs/deploy.md) · [panel](docs/panel.md) · [development](docs/development.md) · [configuration](docs/configuration.md) |

## Quick start

```sh
npm install && npm run fonts      # once
npm run render                    # renders harness/jobs.json into out/
HA_TOKEN=... npm run deploy -- --dashboard
```

Full instructions, including the Home Assistant prerequisites, are in [docs/deploy.md](docs/deploy.md).

## Not done yet

- Partial refresh / skip-if-unchanged on the panel; the ESPHome config exists but has not been run on a device yet
- Self-hosted fonts (the card currently loads Sofia Sans from Google Fonts at render time)
