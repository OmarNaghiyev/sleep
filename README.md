# Sleep Schedule Viewer

Static web app displaying daily prayer times with sleep scheme classification for Erie, PA and Baku, AZ — 2026.

## Files
- `index.html` — structure
- `style.css` — dark theme (IBM Plex Mono/Sans)
- `data.js` — prayer time data for both cities
- `app.js` — all logic: interval calc, scheme assignment, city switcher, filters

## Sleep Schemes
- **5-0** — single block, Isha→sunrise interval ≥ 9h
- **4-1** — two blocks, interval < 9h

## Cities
- **Erie, PA**: 5-0 `22:00–06:00`, 4-1 `23:00–05:30 | 05:50–07:30`
- **Baku**: 5-0 `22:00–05:45`, 4-1 `22:20–04:50 | 05:10–06:50`

## Transitions (Erie)
- Apr 22 → 4-1
- Aug 23 → 5-0

## Transitions (Baku)
- Apr 19 → 4-1
- Aug 24 → 5-0