// app.js

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_RU = {
  January:"Январь", February:"Февраль", March:"Март", April:"Апрель",
  May:"Май", June:"Июнь", July:"Июль", August:"Август",
  September:"Сентябрь", October:"Октябрь", November:"Ноябрь", December:"Декабрь"
};

const CITY_CONFIG = {
  erie: {
    label: "Erie, PA",
    // Scheme based on Isha time: ≥ 21:00 → 4-1 (too late for 5-0), < 21:00 → 5-0
    getScheme(isha) {
      return toMinutes(isha) >= 21 * 60 ? "4-1" : "5-0";
    },
    getSleepStr(scheme) {
      if (scheme === "5-0") return "21:30 – 05:30";
      return "23:00 – 05:30 | 05:50 – 07:30";
    },
  },
  baku: {
    label: "Baku",
    getScheme(isha) {
      return toMinutes(isha) >= 21 * 60 ? "4-1" : "5-0";
    },
    getSleepStr(scheme) {
      if (scheme === "5-0") return "21:30 – 05:30";
      return "22:20 – 04:50 | 05:10 – 06:50";
    },
  },
};

let currentCity = "erie";

function toMinutes(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function formatTime(totalMins) {
  const mins = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
}

function intervalMinutes(ishaStr, sunriseStr) {
  let isha = toMinutes(ishaStr);
  let sunrise = toMinutes(sunriseStr);
  if (sunrise <= isha) sunrise += 1440;
  return sunrise - isha;
}

function formatInterval(mins) {
  return `${Math.floor(mins/60)}h ${(mins%60).toString().padStart(2,"0")}m`;
}

function todayKey() {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()]}-${d.getDate()}-2027`;
}

function buildTable() {
  const cfg = CITY_CONFIG[currentCity];
  const data = currentCity === "erie" ? ERIE_DATA : BAKU_DATA;
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  const today = todayKey();
  let lastMonth = null;
  let prevScheme = null;

  data.forEach(([month, day, fajr, sunrise, dhuhr, asr, maghrib, isha]) => {
    if (month !== lastMonth) {
      const sep = document.createElement("tr");
      sep.classList.add("month-row");
      const td = document.createElement("td");
      td.colSpan = 10;
      td.textContent = month + " 2027";
      sep.appendChild(td);
      sep.dataset.month = month;
      tbody.appendChild(sep);
      lastMonth = month;
    }

    const mins = intervalMinutes(isha, sunrise);
    const scheme = cfg.getScheme(isha);
    const rowKey = `${month}-${day}-2027`;
    const isToday = rowKey === today;

    if (prevScheme !== null && scheme !== prevScheme) {
      const tr = document.createElement("tr");
      tr.classList.add("transition-marker");
      tr.dataset.month = month;
      const td = document.createElement("td");
      td.colSpan = 10;
      td.innerHTML = `▸ Switch to <strong>${scheme}</strong> — ${day} ${month} (Isha ${isha})`;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    prevScheme = scheme;

    const tr = document.createElement("tr");
    tr.dataset.scheme = scheme;
    tr.dataset.month = month;
    if (isToday) tr.classList.add("today");

    const dateStr = `${day.toString().padStart(2,"0")} ${month.substring(0,3)}`;
    const intervalClass = scheme === "5-0" ? "good" : "mid";
    const schemeClass = scheme === "5-0" ? "scheme-50" : "scheme-41";
    const sleepStr = cfg.getSleepStr(scheme);

    tr.innerHTML = `
      <td>${dateStr}${isToday ? ' <span style="color:var(--accent);font-size:0.65rem">◀</span>' : ""}</td>
      <td>${fajr}</td>
      <td style="color:var(--muted)">${sunrise}</td>
      <td>${dhuhr}</td>
      <td>${asr}</td>
      <td>${maghrib}</td>
      <td>${isha}</td>
      <td class="interval ${intervalClass}">${formatInterval(mins)}</td>
      <td class="sleep-time">${sleepStr}</td>
      <td><span class="scheme-pill ${schemeClass}">${scheme}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      document.querySelectorAll("#tableBody tr").forEach(row => {
        if (row.classList.contains("month-row") || row.classList.contains("transition-marker")) {
          row.classList.remove("hidden"); return;
        }
        row.classList.toggle("hidden", filter !== "all" && row.dataset.scheme !== filter);
      });
      document.querySelectorAll("#tableBody tr.month-row").forEach(mr => {
        const m = mr.dataset.month;
        const visible = Array.from(document.querySelectorAll(`#tableBody tr[data-month="${m}"]:not(.month-row):not(.transition-marker)`)).some(r => !r.classList.contains("hidden"));
        mr.classList.toggle("hidden", !visible);
        document.querySelectorAll(`#tableBody tr.transition-marker[data-month="${m}"]`).forEach(t => t.classList.toggle("hidden", !visible));
      });
    });
  });
}

function setupCitySwitcher() {
  document.querySelectorAll(".city-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".city-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCity = btn.dataset.city;
      document.querySelector(".header-sub").textContent = CITY_CONFIG[currentCity].label + " · 2027";
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      document.querySelector('.filter-btn[data-filter="all"]').classList.add("active");
      buildTable();
      scrollToToday();
    });
  });
}

function scrollToToday() {
  const todayRow = document.querySelector("tr.today");
  if (todayRow) setTimeout(() => todayRow.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem("theme");
  if (saved === "light") { document.documentElement.dataset.theme = "light"; btn.textContent = "☾"; }
  btn.addEventListener("click", () => {
    const isLight = document.documentElement.dataset.theme === "light";
    document.documentElement.dataset.theme = isLight ? "dark" : "light";
    btn.textContent = isLight ? "☀" : "☾";
    localStorage.setItem("theme", isLight ? "dark" : "light");
  });
}

buildTable();
setupFilters();
setupCitySwitcher();
setupThemeToggle();
scrollToToday();