// scripts/update-data.js
// Fetches prayer times from Aladhan API for the next year and writes data.js
// Run automatically by GitHub Actions on Dec 31 each year

const fs = require("fs");
const path = require("path");

// Manual: node scripts/update-data.js 2026
// Cron (Dec 31): no arg → auto-fetches next year
const YEAR = parseInt(process.argv[2]) || new Date().getFullYear() + 1;

const CITIES = [
  {
    name: "ERIE",
    latitude: 42.0667,
    longitude: -80.1664,
    method: 2,       // ISNA — same as islamicfinder
    school: 0,       // Shafi/Hanbali/Maliki
    timezone: "America/New_York",
  },
  {
    name: "BAKU",
    latitude: 40.3953,
    longitude: 49.8822,
    method: 3,       // Muslim World League — same as islamicfinder
    school: 0,       // Shafi/Hanbali/Maliki
    timezone: "Asia/Baku",
  },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function stripTimezone(timeStr) {
  // Aladhan returns "06:26 (EST)" — strip the timezone part
  return timeStr.replace(/\s*\(.*\)/, "").trim();
}

function to12Hour(time24) {
  // Convert "06:26" to "06:26 AM" / "18:24" to "06:24 PM"
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
}

async function fetchMonth(city, month) {
  const url = `https://api.aladhan.com/v1/calendar/${YEAR}/${month}` +
    `?latitude=${city.latitude}&longitude=${city.longitude}` +
    `&method=${city.method}&school=${city.school}` +
    `&timezonestring=${city.timezone}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${city.name} month ${month}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(`API error: ${json.status}`);
  return json.data;
}

async function fetchCity(city) {
  const rows = [];
  for (let m = 1; m <= 12; m++) {
    console.log(`  Fetching ${city.name} — ${MONTH_NAMES[m - 1]} ${YEAR}...`);
    const days = await fetchMonth(city, m);
    for (const day of days) {
      const t = day.timings;
      const dayNum = parseInt(day.date.gregorian.day);
      rows.push([
        MONTH_NAMES[m - 1],
        dayNum,
        to12Hour(stripTimezone(t.Fajr)),
        to12Hour(stripTimezone(t.Sunrise)),
        to12Hour(stripTimezone(t.Dhuhr)),
        to12Hour(stripTimezone(t.Asr)),
        to12Hour(stripTimezone(t.Maghrib)),
        to12Hour(stripTimezone(t.Isha)),
      ]);
    }
    // Small delay to be polite to the API
    await new Promise(r => setTimeout(r, 300));
  }
  return rows;
}

function formatRows(rows) {
  // Group by month, one line per month
  const byMonth = {};
  for (const row of rows) {
    const m = row[0];
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(JSON.stringify(row));
  }
  return MONTH_NAMES
    .filter(m => byMonth[m])
    .map(m => "  " + byMonth[m].join(","))
    .join(",\n");
}

async function main() {
  console.log(`Fetching prayer times for ${YEAR}...`);

  const erieRows = await fetchCity(CITIES[0]);
  const bakuRows = await fetchCity(CITIES[1]);

  const output =
    `// data.js — prayer times for Erie and Baku ${YEAR}\n` +
    `// Format: [month, day, fajr, sunrise, dhuhr, asr, maghrib, isha]\n` +
    `// Auto-generated on ${new Date().toISOString().split("T")[0]} by scripts/update-data.js\n\n` +
    `const DATA_YEAR = ${YEAR};\n\n` +
    `const ERIE_DATA = [\n${formatRows(erieRows)}\n];\n\n` +
    `const BAKU_DATA = [\n${formatRows(bakuRows)}\n];\n`;

  const outPath = path.join(__dirname, "..", "data.js");
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`\nWrote ${outPath}`);

  console.log(`Year ${YEAR} written to data.js as DATA_YEAR`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
