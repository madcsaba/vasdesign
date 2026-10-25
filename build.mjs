// Vasdesign — statikus oldalépítő
// A data/content.json tartalmából és a kategóriánkénti képadatokból (raw/by-category.json)
// generálja az oldalakat a public/ mappába.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const PUB = path.join(ROOT, 'public');
const OUT = PUB; // az oldalak közvetlenül a public-ba kerülnek

const C = JSON.parse(await readFile(path.join(ROOT, 'data/content.json'), 'utf8'));
const CAT = existsSync(path.join(ROOT, 'raw/by-category.json'))
  ? JSON.parse(await readFile(path.join(ROOT, 'raw/by-category.json'), 'utf8'))
  : {};
const SITE = C.site;

// ---------- apró segédek ----------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const galImgs = (cat) => (CAT[cat] || []).map((x) => x.file);

// Képgaléria HTML: széles/négyzetes váltakozó rácsban
function gallery(cat, { limit = 0, lazy = true } = {}) {
  let imgs = galImgs(cat);
  if (limit) imgs = imgs.slice(0, limit);
  if (!imgs.length) return '';
  const cells = imgs.map((f, i) => {
    const cls = i % 5 === 0 ? 'g-wide' : (i % 2 === 0 ? 'g-sq' : 'g-tall');
    return `<a class="${cls}" href="/img/opt/${esc(f)}" data-lightbox="g-${esc(cat)}">` +
      `<img src="/img/opt/${esc(f)}" alt="${esc(SITE.name)} munka — ${esc(cat.replace(/-/g, ' '))} ${i + 1}"` +
      ` width="1200" height="800" ${lazy ? 'loading="lazy" decoding="async"' : ''}>` +
      `</a>`;
  }).join('\n');
  return `<div class="gallery">${cells}</div>`;
}

// ---------- lap-váz ----------
const NAV = [
  ['/', 'Főoldal'],
  ['/szolgaltatasok/', 'Szolgáltatások'],
  ['/galeria/', 'Galéria'],
  ['/rolam/', 'Rólam'],
  ['/kapcsolat/', 'Kapcsolat'],
];

function head({ title, desc, current }) {
  const navLinks = NAV.map(([href, label]) =>
    `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#faf8f5">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
</head>
<body>
<a class="skip" href="#main">Ugrás a tartalomra</a>
<header class="site-head" id="top">
  <div class="wrap head-in">
    <a class="brand" href="/"><b>VASDESIGN</b><span>${esc(SITE.tagline.split(',')[0])}</span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menü</button>
    <nav class="nav" id="nav" aria-label="Fő navigáció">
      ${navLinks}
      <a class="cta" href="/kapcsolat/#ajanlatkeres">Ajánlatkérés</a>
    </nav>
  </div>
</header>
<main id="main">`;
}

const foot = () => `
</main>
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <b>VASDESIGN</b>
        <p>${esc(SITE.tagline)}. Tervezés és kivitelezés egy kézben, több mint ${esc(SITE.years)} év tapasztalattal.</p>
      </div>
      <div class="foot-col">
        <h4>Oldalak</h4>
        <ul>
          <li><a href="/szolgaltatasok/">Szolgáltatások</a></li>
          <li><a href="/galeria/">Galéria</a></li>
          <li><a href="/rolam/">Rólam</a></li>
          <li><a href="/kapcsolat/">Kapcsolat</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>Elérhetőség</h4>
        <ul>
          <li><a href="tel:${esc(SITE.phoneHref)}">${esc(SITE.phone)}</a></li>
          <li><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>
          <li>${esc(SITE.address)}</li>
          <li>${esc(SITE.company)}</li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} ${esc(SITE.company)} — ${esc(SITE.name)}. Minden jog fenntartva.</span>
      <span>${esc(SITE.hours)}</span>
    </div>
  </div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>`;

// ---------- lapok ----------
function homePage() {
  const svcCards = C.services.map((s) => `
    <a class="card" href="/szolgaltatasok/#${esc(s.slug)}">
      <figure><img src="/img/opt/${esc(galImgs(s.img)[0] || '')}" alt="${esc(s.title)}" width="1200" height="800" loading="lazy" decoding="async"></figure>
      <div class="card-body">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.short)}</p>
        <span class="more">Részletek</span>
      </div>
    </a>`).join('');

  const pillars = C.pillars.map((p) => `
      <div class="pillar"><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></div>`).join('');

  const process = C.process.map((s) => `
      <div class="step"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join('');

  return head({
    title: `${SITE.name} — ${SITE.tagline}`,
    desc: SITE.tagline + '. Egyedi tervezésű vas- és kovácsoltvas elemek, térelválasztók, galériák, mini wellness fürdőszobák és belvárosi teraszok.',
    current: '/',
  }) + `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="eyebrow">Tervezés és kivitelezés egy kézben</p>
      <h1>Vas, kovácsoltvas, üveg és fa — romantikustól a minimalistáig.</h1>
      <p class="lede">Egyedi tervezésű vas- és kovácsoltvas elemek gyártása, valamint belsőépítészet a belváros szívében. Korlátok, előtetők, ajtók, térelválasztók, galériák és mini wellness fürdőszobák.</p>
      <div class="btn-row">
        <a class="btn" href="/kapcsolat/#ajanlatkeres">Ajánlatot kérek</a>
        <a class="btn ghost" href="/galeria/">Munkáim megtekintése</a>
      </div>
      <div class="hero-stats">
        <div class="stat"><b>${esc(SITE.years)} év</b><span>szakmai tapasztalat</span></div>
        <div class="stat"><b>620+</b><span>kész munka a portfólióban</span></div>
        <div class="stat"><b>1 kéz</b><span>tervezéstől a beépítésig</span></div>
      </div>
    </div>
    <div class="hero-figure">
      <img src="/img/opt/${esc(galImgs('referencia-lakas')[0] || galImgs('furdoszoba')[0] || '')}" alt="Vasdesign belsőépítészeti munka" width="1200" height="1500" fetchpriority="high" decoding="async">
    </div>
  </div>
</section>

<section class="tone">
  <div class="wrap">
    <div class="section-head center">
      <p class="eyebrow">Mit csinálok</p>
      <h2>Szolgáltatások</h2>
      <p class="lede">Az ötlettől a beépítésig — minden, ami vasból, üvegből és szenvedéllyel készül.</p>
    </div>
    <div class="grid grid-3">${svcCards}</div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Miért Vasdesign</p>
      <h2>A vas karaktert ad a térnek</h2>
    </div>
    <div class="pillars">${pillars}</div>
  </div>
</section>

<section class="tone">
  <div class="wrap about-grid">
    <div class="about-figure">
      <img src="/img/opt/${esc(galImgs('terasz')[0] || galImgs('galeria')[0] || '')}" alt="Belvárosi terasz" width="1000" height="1250" loading="lazy" decoding="async">
    </div>
    <div>
      <p class="eyebrow">Rólam</p>
      <blockquote class="quote">${esc(C.quote)}</blockquote>
      <p>${esc(C.about)}</p>
      <a class="btn ghost" href="/rolam/">Tovább rólam</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Hogyan dolgozunk</p>
      <h2>A rendelés menete</h2>
      <p class="lede">Az oldal nem webáruházként működik — minden megrendelés személyes egyeztetéssel indul.</p>
    </div>
    <div class="steps">${process}</div>
    <div class="btn-row"><a class="btn" href="/kapcsolat/#ajanlatkeres">Kezdjük el</a></div>
  </div>
</section>

<section class="tone tight">
  <div class="wrap section-head center" style="margin-bottom:0">
    <h2>Készen áll egy egyedi vas design elemre?</h2>
    <p class="lede">Írjon, és egyeztessünk személyes találkozót a részletekért.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn" href="tel:${esc(SITE.phoneHref)}">${esc(SITE.phone)}</a>
      <a class="btn ghost" href="/kapcsolat/">Kapcsolat</a>
    </div>
  </div>
</section>` + foot();
}

function servicesPage() {
  const blocks = C.services.map((s, i) => {
    const g = gallery(s.img, { limit: 6 });
    return `
<section id="${esc(s.slug)}" class="${i % 2 ? 'tone' : ''}">
  <div class="wrap">
    <div class="about-grid">
      <div${i % 2 ? ' style="order:2"' : ''}>
        <p class="eyebrow">0${i + 1}</p>
        <h2>${esc(s.title)}</h2>
        <p class="lede">${esc(s.short)}</p>
        <p>${esc(s.body)}</p>
        <div class="btn-row"><a class="btn ghost" href="/kapcsolat/#ajanlatkeres">Árajánlatot kérek</a></div>
      </div>
      <div${i % 2 ? ' style="order:1"' : ''}>${g || ''}</div>
    </div>
  </div>
</section>`;
  }).join('');

  return head({
    title: `Szolgáltatások — ${SITE.name}`,
    desc: 'Vas-üveg ajtók, térelválasztók, galériák, mini wellness fürdőszobák, belvárosi teraszok és lakásátalakítás — tervezés és kivitelezés egy kézben.',
    current: '/szolgaltatasok/',
  }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow">Szolgáltatások</p>
    <h1>Amiben segíteni tudok</h1>
    <p class="lede">A térelválasztótól a teljes lakásátalakításig — minden, ami vas, üveg és egyedi tervezés.</p>
  </div>
</section>` + blocks + foot();
}

function galleryPage() {
  const cats = [
    ['referencia-lakas', 'Belsőépítészet, lakásátalakítás'],
    ['furdoszoba', 'Mini wellness fürdőszobák'],
    ['galeria', 'Vas galériák'],
    ['terasz', 'Belvárosi teraszok'],
    ['kiegeszitok', 'Design tárgyak, lakberendezés'],
  ];
  const secs = cats.map(([cat, label]) => {
    const n = galImgs(cat).length;
    if (!n) return '';
    return `
<section class="tight">
  <div class="wrap">
    <div class="section-head">
      <h2>${esc(label)}</h2>
      <p class="note">${n} munka</p>
    </div>
    ${gallery(cat)}
  </div>
</section>`;
  }).join('\n');

  return head({
    title: `Galéria — ${SITE.name}`,
    desc: 'Vasdesign munkák: belsőépítészet, mini wellness fürdőszobák, vas galériák, belvárosi teraszok és design tárgyak.',
    current: '/galeria/',
  }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow">Portfólió</p>
    <h1>Galéria</h1>
    <p class="lede">Több száz kész munka — kattintson a képre a nagy nézethez.</p>
  </div>
</section>` + secs + foot();
}

function aboutPage() {
  return head({
    title: `Rólam — ${SITE.name}`,
    desc: 'Több mint 20 év tapasztalat egyedi vas- és kovácsoltvas elemek, valamint belsőépítészet tervezésében és kivitelezésében.',
    current: '/rolam/',
  }) + `
<section class="hero">
  <div class="wrap about-grid">
    <div class="about-figure">
      <img src="/img/opt/${esc(galImgs('referencia-lakas')[1] || galImgs('referencia-lakas')[0] || '')}" alt="Vasdesign munka közben" width="1000" height="1250" fetchpriority="high" decoding="async">
    </div>
    <div>
      <p class="eyebrow">Rólam</p>
      <h1>${esc(C.quote)}</h1>
      <p class="lede">${esc(C.about)}</p>
      <p>A minimál és hightech építészet hatására divatba jöttek a kovácsoltvas és vas design elemek, vasból készült bútorok, ajtók, térelválasztók és lakáskiegészítők. Az üveg és fa elemek, antik tárgyak és művészeti alkotások egyensúlya a vassal emeli a tér eleganciáját és eklektikáját.</p>
      <div class="hero-stats">
        <div class="stat"><b>${esc(SITE.years)} év</b><span>tapasztalat</span></div>
        <div class="stat"><b>${esc(SITE.yearSince)}</b><span>óta a szakmában</span></div>
      </div>
    </div>
  </div>
</section>
<section class="tone">
  <div class="wrap">
    <div class="pillars">${C.pillars.map((p) => `<div class="pillar"><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></div>`).join('')}</div>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><h2>Hogyan dolgozunk</h2></div>
    <div class="steps">${C.process.map((s) => `<div class="step"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join('')}</div>
    <div class="btn-row"><a class="btn" href="/kapcsolat/#ajanlatkeres">Kérjen ajánlatot</a></div>
  </div>
</section>` + foot();
}

function contactPage() {
  return head({
    title: `Kapcsolat — ${SITE.name}`,
    desc: `${SITE.name} elérhetőségei: ${SITE.phone}, ${SITE.email}, ${SITE.address}. Kérjen ajánlatot egyedi vas design elemre.`,
    current: '/kapcsolat/',
  }) + `
<section class="hero">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Kapcsolat</p>
      <h1>Lépjünk kapcsolatba</h1>
      <p class="lede">Kérjen ajánlatot, vagy tegyen fel kérdést — a részleteket személyesen egyeztetjük.</p>
    </div>
    <div class="contact-grid">
      <div>
        <ul class="contact-list">
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/></svg>
            <span><span class="k">Telefon</span><a class="v" href="tel:${esc(SITE.phoneHref)}">${esc(SITE.phone)}</a></span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
            <span><span class="k">E-mail</span><a class="v" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span><span class="k">Cím</span><span class="v">${esc(SITE.address)}</span></span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <span><span class="k">Nyitvatartás</span><span class="v">${esc(SITE.hours)}</span></span></li>
        </ul>
      </div>
      <div id="ajanlatkeres">
        <form action="mailto:${esc(SITE.email)}" method="post" enctype="text/plain">
          <div class="field"><label for="nev">Név</label><input id="nev" name="nev" type="text" required autocomplete="name"></div>
          <div class="field"><label for="email">E-mail cím</label><input id="email" name="email" type="email" required autocomplete="email"></div>
          <div class="field"><label for="targy">Tárgy</label><input id="targy" name="targy" type="text"></div>
          <div class="field"><label for="uzenet">Üzenet</label><textarea id="uzenet" name="uzenet" rows="5" required></textarea></div>
          <button class="btn" type="submit">Üzenet küldése</button>
        </form>
      </div>
    </div>
  </div>
</section>` + foot();
}

// ---------- mentés ----------
async function write(rel, html) {
  const p = path.join(OUT, rel);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, html);
}

await write('index.html', homePage());
await write('szolgaltatasok/index.html', servicesPage());
await write('galeria/index.html', galleryPage());
await write('rolam/index.html', aboutPage());
await write('kapcsolat/index.html', contactPage());

console.log('✓ 5 oldal generálva a public/ mappába');
console.log('  képek kategóriánként:', Object.entries(CAT).map(([k, v]) => `${k}=${v.length}`).join(', '));
