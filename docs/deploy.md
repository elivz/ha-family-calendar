# Deploying to Home Assistant

Tested against Home Assistant OS 2026.10 on a Raspberry Pi. HA must be able to reach the internet (the card loads
Google Fonts when it renders).

## 1. Prerequisites in HA

| Need | Why | Notes |
|---|---|---|
| **Puppet** app (balloob/home-assistant-addons repository) | Screenshots dashboard views | In its config set your HA URL and a long-lived access token. It listens on port 10000. |
| **Downloader** integration | Saves the screenshots as files | Settings > Devices & services > Add integration > Downloader. Download directory: `/config/www`. |
| Calendar integrations | Event data | Google Calendar for the family calendar; Remote Calendar (ICS) for school/Scouts/holidays. Note the `calendar.*` entity IDs. |
| Weather integrations | Forecasts | Met.no (`weather.forecast_home`) for amounts/UV, National Weather Service for highs/lows and precipitation chance. Note the entity IDs. |

Test Puppet first: open `http://<ha-host>:10000/lovelace/0?viewport=800x480&eink=2` in a browser. You should get a PNG.

## 2. Create the card resource

The card is one JS file, `src/eink-calendar-card.js`. Two ways to register it:

**A. Script (recommended).** Create a long-lived token (HA profile > Security), then:

```sh
HA_URL=http://homeassistant.local:8123 HA_TOKEN=<token> node scripts/deploy.js --dashboard
```

This registers the card as a dashboard resource (type `module`, inline `data:` URI, so nothing to host or cache-bust)
and creates/updates the `eink-panel` dashboard from `dashboard/eink-panel.json`. Skip `--dashboard` to push only the
card. Edit the entity IDs in `dashboard/eink-panel.json` first (step 3). The script has not yet been run against a
live instance; if it fails, use B.

**B. Manually.**

1. Copy `src/eink-calendar-card.js` to `/config/www/eink-calendar-card.js` (Samba, SSH, or the File editor app).
2. Settings > Dashboards > ⋮ > Resources > Add resource: URL `/local/eink-calendar-card.js?v=1`, type *JavaScript module*.
3. On every update, copy the file again and bump `?v=` so browsers (and Puppet) reload it.

## 3. Create the dashboard

If you did not use `--dashboard`: Settings > Dashboards > Add dashboard > "New dashboard from scratch", URL
`eink-panel`, then raw-edit it and paste `dashboard/eink-panel.json` (as YAML or JSON).

Edit the entity IDs for your calendars and weather. Options are documented in [configuration.md](configuration.md).
The dashboard must be named `eink-panel` and its view paths must be `home`, `week`, `weather`, because the automation
and Puppet URLs use them.

**Keeping your real config out of git.** Copy `dashboard/eink-panel.json` to `dashboard/eink-panel.local.json` and
`ha/automation.yaml` to `ha/automation.local.yaml`, then put your real entity IDs and folder name in the copies.
`*.local.*` is git-ignored, and `scripts/deploy.js --dashboard` uses the `.local` dashboard when it exists.

## 4. Pick the output folder

Anything under `/config/www/` is served at `/local/` **without authentication**. Choose a random folder name, for
example `eink-` plus 12 random characters:

```sh
echo eink-$(head -c 9 /dev/urandom | base64 | tr -dc 'a-z0-9' | head -c 12)
```

Treat the name as a secret (anyone with the URL can see your calendar). If HA is exposed to the internet, also block
`/local/eink*` at your proxy/WAF.

## 5. Create the automation

Settings > Automations > Create > Edit in YAML, paste `ha/automation.yaml`, and replace both `eink-RANDOM` with your
folder name. Change `calendar.family` to the calendar entity that should be force-refreshed. It runs every 15
minutes between 05:45 and 22:30 and on HA start.

The warm-up request is intentional: the Downloader has a fixed 10 s timeout and a cold Puppet render can exceed it.
Each download has `continue_on_error`, so one failed view does not block the others; the next run retries.

## 6. Verify

1. Run the automation manually (Settings > Automations > ⋮ > Run actions).
2. Open `http://<ha-host>:8123/local/eink-RANDOM/home.png`. Expect a black-and-white 800×480 image.
3. Check `week.png` and `weather.png` the same way.

## 7. Updating

Edit `src/eink-calendar-card.js`, run `npm run render` to check the result, then run `node scripts/deploy.js` again
(or repeat step 2B). The next automation run renders with the new code; to see it immediately, run the automation.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| PNG is blank/white | Cold Puppet start. Re-run the automation; the warm-up request normally prevents it. |
| `Bad Gateway` / connection failed | Puppet is restarting. Wait 1–2 minutes. |
| Text in a fallback font, layout slightly off | Google Fonts did not load in time. Re-run; check HA's internet access. |
| Card not found on the dashboard | Resource not registered or browser cache. Hard-refresh; check Settings > Dashboards > Resources. |
| Old content in PNGs | Automation condition window (05:45–22:30), or `downloader.download_file` errors in the logs. |
| `+N more` in a list | More events than fit; by design. The Home side lists share space, so a quiet day gives its room to a busy one. |
