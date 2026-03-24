// hadith.js — Sahih Al-Bukhari via fawazahmed0/hadith-api on jsDelivr

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

let currentDisplay = 'both'; // 'ar' | 'en' | 'both'
let currentSection = 1;
let sectionsData = {};        // { "1": "Revelation", "2": "Belief", ... }
const cache = {};             // "en-1", "ar-1", etc.

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  setupTheme();
  setupDisplayToggle();
  await loadSectionList();
  loadSection(1);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function setupTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.dataset.theme = 'light';
    btn.textContent = '☾';
  }
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.dataset.theme === 'light';
    document.documentElement.dataset.theme = isLight ? 'dark' : 'light';
    btn.textContent = isLight ? '☀' : '☾';
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
  });
}

// ── Display toggle ────────────────────────────────────────────────────────────

function setupDisplayToggle() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDisplay = btn.dataset.display;
      renderSection(currentSection);
    });
  });
}

// ── Section (book) list ───────────────────────────────────────────────────────

async function loadSectionList() {
  const sidebar = document.getElementById('bookSidebar');
  try {
    const res = await fetch(`${BASE}/eng-bukhari/sections.json`);
    const json = await res.json();
    sectionsData = json.sections;
    renderSidebar();
  } catch {
    sidebar.innerHTML = '<div class="sidebar-loading">Failed to load — check connection</div>';
  }
}

function renderSidebar() {
  const sidebar = document.getElementById('bookSidebar');
  sidebar.innerHTML = Object.entries(sectionsData).map(([num, name]) => `
    <div class="book-item" data-section="${num}">
      <span class="book-num">${num}</span>
      <span class="book-name">${name}</span>
    </div>
  `).join('');

  sidebar.querySelectorAll('.book-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadSection(parseInt(item.dataset.section));
    });
  });

  sidebar.querySelector('.book-item')?.classList.add('active');
}

// ── Load section ──────────────────────────────────────────────────────────────

async function loadSection(num) {
  currentSection = num;
  const inner = document.getElementById('contentInner');
  inner.innerHTML = '<div class="loading-text">Loading…</div>';

  try {
    const fetches = [];
    if (!cache[`en-${num}`]) {
      fetches.push(
        fetch(`${BASE}/eng-bukhari/sections/${num}.json`)
          .then(r => r.json())
          .then(d => { cache[`en-${num}`] = d.hadiths ?? []; })
      );
    }
    if (!cache[`ar-${num}`]) {
      fetches.push(
        fetch(`${BASE}/ara-bukhari/sections/${num}.json`)
          .then(r => r.json())
          .then(d => { cache[`ar-${num}`] = d.hadiths ?? []; })
      );
    }
    await Promise.all(fetches);
    renderSection(num);
    document.getElementById('hadithContent').scrollTop = 0;
  } catch {
    inner.innerHTML = '<div class="loading-text">Failed to load — check connection</div>';
  }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderSection(num) {
  const inner = document.getElementById('contentInner');
  const enList = cache[`en-${num}`] ?? [];
  const arList = cache[`ar-${num}`] ?? [];
  const bookName = sectionsData[String(num)] ?? `Book ${num}`;

  const showAr = currentDisplay === 'ar' || currentDisplay === 'both';
  const showEn = currentDisplay === 'en' || currentDisplay === 'both';
  const showBoth = currentDisplay === 'both';

  let html = `
    <div class="section-header">
      <span class="section-label">Book ${num}</span>
      <span class="section-name">${bookName}</span>
      <span class="section-count">${enList.length} hadiths</span>
    </div>
  `;

  html += enList.map((en, i) => {
    const ar = arList[i];
    const grade = en.grades?.[0]?.grade ?? '';

    return `
      <div class="hadith-card">
        <div class="hadith-num">${en.hadithnumber}</div>
        <div class="hadith-body">
          ${showAr && ar ? `<div class="hadith-ar">${ar.text}</div>` : ''}
          ${showBoth && ar ? `<div class="hadith-divider"></div>` : ''}
          ${showEn ? `<div class="hadith-en">${en.text}</div>` : ''}
          ${grade ? `<div class="hadith-grade">${grade}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  inner.innerHTML = html;
}

init();
