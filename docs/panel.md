# Setting up the reTerminal E1001

The panel does no layout. Every wake it downloads one PNG from Home Assistant, draws it, and goes back to deep sleep.
The firmware is `esphome/family-calendar.yaml`.

| Wake source | Shows |
|---|---|
| Timer (just after each quarter hour), power-on | Home |
| Left white button | Week |
| Right white button | Weather |
| Green button | Home, and stays awake 10 minutes (OTA uploads, logs) |

After a power-on or USB reset the panel also stays awake 10 minutes. Overnight (22:30 to 05:45) it sleeps until the
automation resumes. Below 15% battery a small "LOW BATTERY" box is drawn in the bottom-right corner.

## 1. One-time computer setup

```sh
pipx install esphome        # or: brew install esphome
esphome version
```

## 2. Configure

```sh
cd esphome
cp secrets.example.yaml secrets.yaml     # skip if secrets.yaml already exists
```

Fill in `secrets.yaml`:

- `wifi_ssid` / `wifi_password`: 2.4 GHz network.
- `ota_password`: any string.
- `eink_base_url`: `http://<HA LAN IP>:8123/local/<your-random-folder>/` with the trailing slash. Use the IP, not
  `homeassistant.local` (the panel can't resolve mDNS names). Reserve that IP for HA in your router.

Check it from your computer before flashing: `open http://<HA IP>:8123/local/<folder>/home.png` should show the
Home view. The panel fetches over plain HTTP on your LAN and sends no login, so `/local/` must be reachable
unauthenticated (it is by default).

```sh
esphome config family-calendar.yaml      # validates the YAML
```

## 3. First flash (USB)

1. Plug the panel into your computer with a USB-C **data** cable. Switch it on if it has a power switch.
2. `esphome run family-calendar.yaml`, choose the serial port (it appears as `usbserial` or `wch`, a CH340 bridge).
   The first compile downloads the toolchain and takes several minutes.
3. Watch the log: Wi-Fi connects, the PNG downloads, the screen flashes a few times (full refresh) and shows Home.

If no port appears, try another cable or port first. The E-series boards use a CH340 USB-to-UART chip; recent macOS
includes a driver.

## 4. Check the picture

- **Looks like a negative** (white text on black): set `negative: "true"` in the substitutions and run again.
  This is the one setting I could not verify without a device.
- **Cut off or offset:** the PNGs are exactly 800×480; check the files in the browser first.
- **Nothing downloads:** the log shows the HTTP error. Check `eink_base_url`, that HA is reachable from the panel's
  Wi-Fi (no client isolation / guest network), and that the PNG exists.

## 5. Later updates

The panel sleeps almost all the time, so over-the-air uploads only work while it is awake. Press the **green** button
(or power-cycle it), then within 10 minutes: `esphome run family-calendar.yaml --device <panel IP or name>.local`.
Use USB if OTA can't find it. Calendar and layout changes never need a reflash; they happen in Home Assistant.

## 6. Power

Run it for a few days on battery first. To see consumption, read the voltage in the logs on a dev-mode wake, or
check how fast the LOW BATTERY box arrives. If a charge lasts weeks, you're done; if not, either power it over USB-C
(it then still works the same way) or lengthen the sleep (edit the `wake` calculation in `show_and_sleep`).

## Known limits

- Every wake does a full e-paper refresh (it flashes). Partial refresh is not enabled.
- The panel redraws every 15 minutes even when nothing changed. A skip-if-unchanged check would save battery.
- The firmware has not been compiled yet: expect to fix the odd YAML or C++ detail on the first run.
