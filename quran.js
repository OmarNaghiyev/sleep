// quran.js

const EDITIONS = {
  ar: 'quran-uthmani',
  en: 'en.sahih',
  ru: 'ru.kuliev',
};

const HEADER_SUB = {
  ar: 'Original',
  en: 'Saheeh International',
  ru: 'Перевод Кулиева',
};

// Russian meanings for all 114 suras (index 0 = surah 1)
const SURAH_RU = [
  'Открывающая','Корова','Семейство Имрана','Женщины','Трапеза',
  'Скот','Преграды','Трофеи','Покаяние','Йунус',
  'Худ','Йусуф','Гром','Ибрахим','Хиджр',
  'Пчёлы','Ночное путешествие','Пещера','Марьям','Та-Ха',
  'Пророки','Паломничество','Верующие','Свет','Различение',
  'Поэты','Муравьи','Рассказы','Паук','Румы',
  'Лукман','Земной поклон','Союзники','Саба','Творец',
  'Йа-Син','Выстроившиеся в ряды','Сад','Толпы','Прощающий',
  'Разъяснены','Совет','Украшения','Дым','Коленопреклоненные',
  'Барханы','Мухаммад','Победа','Комнаты','Каф',
  'Рассеивающие','Гора','Звезда','Луна','Милостивый',
  'Неизбежное','Железо','Препирающаяся','Сбор','Испытуемая',
  'Ряды','Пятница','Лицемеры','Взаимный урон','Развод',
  'Запрет','Власть','Перо','Неотвратимое','Ступени',
  'Нух','Джинны','Закутавшийся','Завернувшийся','Воскресение',
  'Человек','Посланные','Весть','Исторгающие','Нахмурился',
  'Скручивание','Раскол','Обвешивающие','Разрыв','Созвездия',
  'Ночной странник','Всевышний','Покрывающее','Заря','Город',
  'Солнце','Ночь','Утро','Раскрытие груди','Смоковница',
  'Сгусток','Ночь предопределения','Ясное знамение','Землетрясение','Скачущие',
  'Сокрушительная','Страсть к умножению','Предвечернее время','Хулитель','Слон',
  'Курайшиты','Подаяние','Изобилие','Неверующие','Помощь',
  'Пальмовые волокна','Искренность','Рассвет','Люди',
];

let currentLang = 'ar';
let currentSurah = 1;
let surahListData = [];
const cache = {};

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  setupTheme();
  setupLangSwitcher();
  await loadSurahList();
  loadSurah(1);
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

// ── Language switcher ─────────────────────────────────────────────────────────

function setupLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      document.getElementById('headerSub').textContent = HEADER_SUB[currentLang];
      renderSidebarItems();
      loadSurah(currentSurah);
    });
  });
}

// ── Surah list ────────────────────────────────────────────────────────────────

async function loadSurahList() {
  const sidebar = document.getElementById('surahSidebar');
  try {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const json = await res.json();
    surahListData = json.data;
    renderSidebarItems();
  } catch {
    sidebar.innerHTML = '<div class="sidebar-loading">Failed to load — check connection</div>';
  }
}

function renderSidebarItems() {
  const sidebar = document.getElementById('surahSidebar');
  sidebar.innerHTML = surahListData.map(s => {
    const meaning = getMeaning(s);
    const showArabic = currentLang === 'ar';
    return `
      <div class="surah-item" data-number="${s.number}">
        <span class="surah-num">${s.number}</span>
        <div class="surah-names">
          <span class="surah-en-name">${s.englishName}</span>
          <span class="surah-subtitle">${meaning} · ${s.numberOfAyahs}v</span>
        </div>
        ${showArabic ? `<span class="surah-ar-name">${s.name}</span>` : ''}
      </div>
    `;
  }).join('');

  sidebar.querySelectorAll('.surah-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar.querySelectorAll('.surah-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadSurah(parseInt(item.dataset.number));
    });
  });

  // Restore active state
  const active = sidebar.querySelector(`.surah-item[data-number="${currentSurah}"]`);
  active?.classList.add('active');
}

function getMeaning(s) {
  if (currentLang === 'ar') return s.englishName;
  if (currentLang === 'en') return s.englishNameTranslation;
  return SURAH_RU[s.number - 1] ?? s.englishNameTranslation;
}

// ── Load & render surah ───────────────────────────────────────────────────────

async function loadSurah(number) {
  currentSurah = number;
  const edition = EDITIONS[currentLang];
  const key = `${number}-${edition}`;

  const inner = document.getElementById('contentInner');
  inner.innerHTML = '<div class="loading-text">Loading…</div>';

  try {
    if (!cache[key]) {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${number}/${edition}`);
      const json = await res.json();
      cache[key] = json.data;
    }
    renderSurah(cache[key]);
    document.getElementById('quranContent').scrollTop = 0;
  } catch {
    inner.innerHTML = '<div class="loading-text">Failed to load surah — check connection</div>';
  }
}

function renderSurah(data) {
  const inner = document.getElementById('contentInner');
  const isAr = currentLang === 'ar';
  const revelationType = data.revelationType === 'Meccan' ? 'Meccan' : 'Medinan';
  const meaning = getMeaningByNumber(data.number);

  let infoLine;
  if (isAr) {
    infoLine = `${data.number}. ${data.englishName} · ${revelationType} · ${data.numberOfAyahs} verses`;
  } else {
    infoLine = `${data.number}. ${data.englishName} · ${meaning} · ${revelationType} · ${data.numberOfAyahs} verses`;
  }

  let html = `
    <div class="surah-title">
      <span class="surah-title-ar">${data.name}</span>
      <div class="surah-title-info">${infoLine}</div>
    </div>
  `;

  if (isAr) {
    html += '<div class="ayahs-ar">';
    html += data.ayahs.map(a =>
      `${a.text} <span class="ayah-marker">﴿${toArabicNumerals(a.numberInSurah)}﴾</span>`
    ).join(' ');
    html += '</div>';
  } else {
    html += '<div class="ayahs-list">';
    html += data.ayahs.map(a => `
      <div class="ayah-row">
        <span class="ayah-num">${a.numberInSurah}</span>
        <span class="ayah-text">${a.text}</span>
      </div>
    `).join('');
    html += '</div>';
  }

  inner.innerHTML = html;
}

function getMeaningByNumber(n) {
  const s = surahListData[n - 1];
  if (!s) return '';
  return getMeaning(s);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

init();
