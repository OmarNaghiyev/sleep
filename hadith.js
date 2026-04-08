// hadith.js — Sahih Al-Bukhari via fawazahmed0/hadith-api on jsDelivr

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

let currentDisplay = 'both'; // 'ar' | 'en' | 'ru' | 'both'
let currentSection = 1;
const cache = {};             // "en-1", "ar-1", "ru-1", etc.


// Standard Sahih al-Bukhari book names (97 books)
const BUKHARI_BOOKS = {
  1:'Revelation', 2:'Belief', 3:'Knowledge', 4:'Ablutions (Wudu\')',
  5:'Bathing (Ghusl)', 6:'Menstrual Periods', 7:'Tayammum',
  8:'Prayers (Salat)', 9:'Times of the Prayers', 10:'Call to Prayers (Adhan)',
  11:'Characteristics of Prayer', 12:'Friday Prayer', 13:'Fear Prayer',
  14:'The Two Festivals (Eids)', 15:'Witr Prayer', 16:'Invoking Allah for Rain',
  17:'Eclipses', 18:'Prostration During Recital of Quran',
  19:'Shortening the Prayers', 20:'Prayer at Night (Tahajjud)',
  21:'Actions while Praying', 22:'Funerals (Al-Janaa\'iz)',
  23:'Obligatory Charity Tax (Zakat)', 24:'Zakat ul Fitr',
  25:'Pilgrimage (Hajj)', 26:'Minor Pilgrimage (Umra)',
  27:'Pilgrims Prevented from Completing Pilgrimage',
  28:'Penalty of Hunting while on Pilgrimage', 29:'Virtues of Madinah',
  30:'Fasting', 31:'Praying at Night in Ramadan (Tarawih)',
  32:'Night of Qadr (Lailat-ul-Qadr)', 33:'I\'tikaf',
  34:'Sales and Trade', 35:'As-Salam', 36:'Hiring',
  37:'Transferance of Debt (Al-Hawaala)', 38:'Business by Proxy',
  39:'Agriculture', 40:'Distribution of Water',
  41:'Loans and Bankruptcy', 42:'Lost Things (Luqaata)',
  43:'Oppressions (Al-Mazalim)', 44:'Partnership', 45:'Mortgaging',
  46:'Manumission of Slaves', 47:'Gifts', 48:'Witnesses',
  49:'Peacemaking (As-Sulh)', 50:'Conditions',
  51:'Wills and Testaments', 52:'Fighting for the Cause of Allah (Jihad)',
  53:'One-fifth of Booty (Khumus)', 54:'Beginning of Creation',
  55:'Prophets', 56:'Virtues and Merits of the Prophet',
  57:'Companions of the Prophet', 58:'Merits of the Ansar',
  59:'Military Expeditions (Al-Maghaazi)',
  60:'Prophetic Commentary on the Quran (Tafseer)',
  61:'Virtues of the Quran', 62:'Wedlock and Marriage (Nikaah)',
  63:'Divorce', 64:'Supporting the Family', 65:'Food and Meals',
  66:'Sacrifice on Birth (Aqiqa)', 67:'Hunting and Slaughtering',
  68:'Al-Adha Sacrifice', 69:'Drinks', 70:'Patients', 71:'Medicine',
  72:'Dress', 73:'Good Manners (Al-Adab)', 74:'Asking Permission',
  75:'Invocations', 76:'To Soften the Heart (Ar-Riqaq)',
  77:'Divine Will (Al-Qadar)', 78:'Oaths and Vows',
  79:'Expiation for Unfulfilled Oaths', 80:'Laws of Inheritance',
  81:'Limits and Punishments (Hudood)',
  82:'Punishment of Disbelievers at War', 83:'Blood Money (Ad-Diyaat)',
  84:'Dealing with Apostates', 85:'Under Compulsion (Ikraah)',
  86:'Tricks', 87:'Interpretation of Dreams',
  88:'Afflictions and the End of the World', 89:'Judgments (Ahkaam)',
  90:'Wishes', 91:'Accepting Information from a Truthful Person',
  92:'Holding Fast to the Quran and Sunnah',
  93:'Oneness of Allah (Tawheed)',
};

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  setupTheme();
  setupDisplayToggle();
  loadSectionList();
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

function loadSectionList() {
  // Books are static — no API call needed
  renderSidebar();
}

function renderSidebar() {
  const sidebar = document.getElementById('bookSidebar');
  sidebar.innerHTML = Object.entries(BUKHARI_BOOKS).map(([num, name]) => `
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
    if (!cache[`ru-${num}`]) {
      fetches.push(
        fetch(`${BASE}/rus-bukhari/sections/${num}.json`)
          .then(r => r.json())
          .then(d => { cache[`ru-${num}`] = d.hadiths ?? []; })
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
  const ruList = cache[`ru-${num}`] ?? [];
  const bookName = BUKHARI_BOOKS[num] ?? `Book ${num}`;

  const showAr   = currentDisplay === 'ar'   || currentDisplay === 'both';
  const showEn   = currentDisplay === 'en'   || currentDisplay === 'both';
  const showRu   = currentDisplay === 'ru'   || currentDisplay === 'both';
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
    const ru = ruList[i];
    const grade = en.grades?.[0]?.grade ?? '';

    const parts = [];
    if (showAr && ar) parts.push(`<div class="hadith-ar">${ar.text}</div>`);
    if (showEn)       parts.push(`<div class="hadith-en">${en.text}</div>`);
    if (showRu && ru) parts.push(`<div class="hadith-ru">${ru.text}</div>`);

    const body = showBoth
      ? parts.join('<div class="hadith-divider"></div>')
      : parts.join('');

    return `
      <div class="hadith-card">
        <div class="hadith-num">${en.hadithnumber}</div>
        <div class="hadith-body">
          ${body}
          ${grade ? `<div class="hadith-grade">${grade}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  inner.innerHTML = html;
}

init();
