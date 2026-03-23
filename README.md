# Omar's Sleep Schedule

Personal prayer-time based sleep schedule tracker for Erie, PA and Baku.

## What it does

Displays daily prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) and calculates a sleep scheme based on the Isha → Sunrise interval:

- **5-0** — interval ≥ 9 hours → single sleep block
- **4-1** — interval < 9 hours → split sleep (main + nap)

## Sleep times

| City | 5-0 | 4-1 |
|------|-----|-----|
| Erie, PA | 22:00 – 06:00 | 23:00 – 05:30 \| 05:50 – 07:30 |
| Baku | 22:00 – 05:45 | 22:20 – 04:50 \| 05:10 – 06:50 |

## Data sources

Prayer times are fetched automatically from the [Aladhan API](https://aladhan.com/prayer-times-api):

| City | Calculation method |
|------|--------------------|
| Erie, PA | Islamic Society of North America — ISNA (Fajr 15°, Isha 15°) |
| Baku | Muslim World League — MWL (Fajr 18°, Isha 17°) |

## Auto-update

A GitHub Action runs on **December 31 at 00:00 UTC** each year:
1. Fetches next year's prayer times from Aladhan API
2. Regenerates `data.js`
3. Commits and pushes → Vercel auto-deploys

Can also be triggered manually: Actions → "Update Prayer Times Data" → Run workflow.

## Stack

Plain HTML, CSS, JavaScript. No build step. Deployed on Vercel.
