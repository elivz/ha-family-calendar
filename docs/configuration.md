# Card configuration

```yaml
type: custom:eink-calendar-card
view: home            # home | week | weather
calendars:
  - entity: calendar.family
  - entity: calendar.school
    icon: mdi:school
    dedupe: true
weather: weather.forecast_home
forecast: weather.nws_xxx
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `view` | `home` | `home`, `week` or `weather` |
| `calendars` | required (except `weather`) | List of entity IDs or objects (below) |
| `weather` | – | Weather entity for daily forecast, amounts, UV |
| `forecast` | – | Second weather entity (NWS) merged in for official highs/lows, precipitation chance and hourly data |
| `font` | `sofia` | `sofia` or `roboto` preset |
| `mask` | `[]` | Regex patterns; matching titles are replaced by `mask_label` (e.g. medical appointments) |
| `mask_label` | `Appointment` | Replacement text for masked titles |
| `date` | today | `YYYY-MM-DD` to preview another day |

Home view only:

| Option | Default | Meaning |
|---|---|---|
| `timeline_style` | `box` | Event look: `box`, `bracket`, `solid`, `rail` |
| `timeline_axis` | `elastic` | `linear` = equal hours; `elastic` squeezes hours with no events (see `compress`) |
| `hours` | `[8, 20]` | Visible hour range; extends to fit events |
| `compress` | `0.4` | Height of an empty hour relative to a busy one (elastic axis) |
| `now_marker` | on | `false` hides the current-time arrow |

The header shows today's high/low and, when the chance of rain is above 10%, `· N% rain`.

## Calendar entries

| Key | Meaning |
|---|---|
| `entity` | `calendar.*` entity ID |
| `icon` | MDI icon shown before every title from this calendar |
| `prefix` | Text prepended to titles |
| `dedupe` | Hide an all-day item when this calendar has a timed event with a near-identical title that day, and hide events another calendar already shows at the same time |
| `holiday_icons` | Pick an icon per holiday by name (Thanksgiving, Halloween, …) |
| `busy` | Availability-only calendar: shown as a thin bar beside the hour labels, never as titled events. Blocks that match a family event exactly are skipped. |

## Current-time arrow

A small triangle left of the hour labels marks "now" on the Home view. It is as current as the last render (15 minutes
with the default automation). Before 8 am (from 6 am) the grid starts at the current hour so the arrow has a place.
