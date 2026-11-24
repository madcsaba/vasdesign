// Vasdesign — statikus oldalépítő
// A data/content.json tartalmából és a kategóriánkénti képadatokból (raw/by-category.json)
// generálja az oldalakat a public/ mappába: SEO-fejléc + JSON-LD, rejtett e-mail,
// sitemap.xml, robots.txt, 404.html.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { feluletLap } from './feluletkezeles.mjs';
import { TERMEKEK, termekLap, faqLd } from './termekoldalak.mjs';

const ROOT = new URL('.', import.meta.url).pathname;
const PUB = path.join(ROOT, 'public');
const OUT = PUB;

const C = JSON.parse(await readFile(path.join(ROOT, 'data/content.json'), 'utf8'));
// Képadatok: először a repóba commitolt data/ alól, különben a helyi raw/ alól (CI-ben nincs raw).
const katUtak = [path.join(ROOT, 'data/by-category.json'), path.join(ROOT, 'raw/by-category.json')];
const CAT = existsSync(katUtak[0]) || existsSync(katUtak[1])
  ? JSON.parse(await readFile(katUtak.find((u) => existsSync(u)), 'utf8'))
  : {};
const SITE = C.site;
const URL_ALAP = (SITE.url || '').replace(/\/$/, '');
// Belső útvonalak alapja (pl. /vasdesign a GitHub Pages project oldalnál).
// Helyi előnézethez: BASE= node build.mjs — akkor minden marad a gyökérben.
const BASE = 'BASE' in process.env
  ? process.env.BASE
  : new URL(SITE.url || 'http://x/').pathname.replace(/\/$/, '');

// ---------- segédek ----------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const galImgs = (cat) => (CAT[cat] || []).map((x) => x.file);
// Galériába csak a kellően nagy képek kerülnek (a 300 px körüli WP-maradékok nem).
const MIN_KEP = 600;
const galKepek = (cat) => (CAT[cat] || []).filter((x) => Math.max(x.w || 0, x.h || 0) >= MIN_KEP).map((x) => x.file);
const vanKep = (f) => Object.values(CAT).some((l) => l.some((x) => x.file === f));
const kep = (f, ...tartalek) => [f, ...tartalek].find((x) => x && vanKep(x)) || '';

// E-mail elrejtése a robotok elől: a HTML forrásban nincs "xxx@yyy.hu" mintázat.
// A link szövege emberséges kódolás („kukac"), a valódi cím fordított részekben
// (data-u / data-d) szerepel, amit a site.js állít össze és tesz kattinthatóvá.
const emailTitkositott = (osztaly = 'mail-link') => {
  const [user, domain] = SITE.email.split('@');
  const r = (s) => [...s].reverse().join('');
  return `<a class="${osztaly}" href="#" data-u="${esc(r(user))}" data-d="${esc(r(domain))}" ` +
    `rel="nofollow">E-mail cím megjelenítése</a>`;
};

// Telefonszám elrejtése a robotok elől: a HTML-ben nincs számjegysor, a számjegyek
// betűkké kódolva (0→a … 9→j) szerepelnek, a site.js rakja össze és teszi hívhatóvá.
const kodol = (s) => String(s).replace(/[0-9]/g, (d) => String.fromCharCode(97 + Number(d)));
const telefon = (osztaly = '', felirat = '') =>
  `<a class="tel-link ${osztaly}" href="#" rel="nofollow" data-t="${esc(kodol(SITE.phoneHref))}"` +
  (felirat ? '' : ` data-f="${esc(kodol(SITE.phone))}"`) + `>${felirat || 'Telefonszám megjelenítése'}</a>`;

// Kategóriánkénti, kulcsszavas alt-szöveg (SEO + akadálymentesség)
const ALT_KULCS = {
  'referencia-lakas': 'belsőépítészeti tervezés és lakásátalakítás Budapesten',
  'furdoszoba': 'mini wellness fürdőszoba tervezés és kivitelezés',
  'galeria': 'egyedi vas loft galéria tervezés',
  'terasz': 'belvárosi terasz kialakítása',
  'ajtok': 'vas-üveg ajtó és térelválasztó',
  'kulter': 'egyedi kovácsoltvas kerítés, kapu, korlát és előtető',
  'muhely': 'kovácsolt vas rózsák a műhelyben',
  'lakasban': 'design tárgyak a lakásban',
  'lampa': 'design függőlámpa és csillár',
  'polc': 'egyedi design polc',
  'inspiracio': 'lakberendezési inspiráció',
  'fooldal': 'vas design munka',
  'targyak': 'design tárgy',
  'rendezes': 'rendelés menete',
};
// Képenkénti, egyedi alt-szövegek (data/alt.json) és valós méretek
const ALT = existsSync(path.join(ROOT, 'data/alt.json')) ? JSON.parse(await readFile(path.join(ROOT, 'data/alt.json'), 'utf8')) : {};
const KEPINFO = Object.fromEntries(Object.values(CAT).flat().map((x) => [x.file, x]));
const kiskep = (f) => existsSync(path.join(PUB, 'img/opt/thumb', f));
// <img> attribútumok: valós méret, és ha van kiskép, srcset a gyorsabb betöltéshez
function kepAttr(f, alt, sizes = '(max-width: 720px) 100vw, 33vw') {
  const k = KEPINFO[f] || {};
  const w = k.w || 1200, h = k.h || 800;
  const src = kiskep(f)
    ? `src="/img/opt/thumb/${esc(f)}" srcset="/img/opt/thumb/${esc(f)} ${Math.min(640, Math.max(w, h) === w ? 640 : Math.round(640 * w / h))}w, /img/opt/${esc(f)} ${w}w" sizes="${sizes}"`
    : `src="/img/opt/${esc(f)}"`;
  return `${src} alt="${esc(alt)}" width="${w}" height="${h}"`;
}
const altFor = (f, cat) => ALT[f] || altKeszito(cat);
const altKeszito = (cat) => `${SITE.name} referenciamunka — ${ALT_KULCS[cat] || cat.replace(/-/g, ' ')}`;

/**
 * Egy galéria kép-cseléje. A `data-keres` mező tartalmazza a kereséshez
 * használható szövegeket (fájlnév, kategória, alt-szöveg) – ezek alapján
 * szűr a kereső a böngészőben, új hálózati kérés nélkül.
 */
function galleryCell(cat, f, i, { lazy = true } = {}) {
  const alt = altFor(f, cat);
  const cls = i % 5 === 0 ? 'g-wide' : (i % 2 === 0 ? 'g-sq' : 'g-tall');
  const keres = [f.replace(/\.webp$/, '').replace(/[-_]/g, ' '), ALT_KULCS[cat] || cat.replace(/-/g, ' '), alt].join(' | ');
  return `<a class="${cls}" href="/img/opt/${esc(f)}" data-lightbox="g-${esc(cat)}" data-keres="${esc(keres)}">` +
    `<img ${kepAttr(f, alt, i % 5 === 0 ? '(max-width: 720px) 100vw, 66vw' : '(max-width: 720px) 100vw, 33vw')}` +
    ` ${lazy ? 'loading="lazy" decoding="async"' : ''}>` +
    `</a>`;
}

// Tetszőleges fájllista galériaként (termékoldalak)
function galleryFiles(files) {
  const catOf = (f) => Object.keys(CAT).find((k) => CAT[k].some((x) => x.file === f)) || 'fooldal';
  const cells = files.filter((f) => KEPINFO[f]).map((f, i) => galleryCell(catOf(f), f, i)).join('\n');
  return cells ? `<div class="gallery">${cells}</div>` : '';
}

function gallery(cat, { limit = 0, lazy = true } = {}) {
  let imgs = galKepek(cat);
  if (limit) imgs = imgs.slice(0, limit);
  if (!imgs.length) return '';
  const cells = imgs.map((f, i) => galleryCell(cat, f, i, { lazy })).join('\n');
  return `<div class="gallery">${cells}</div>`;
}

// ---------- lap-váz ----------
const NAV = [
  ['/', 'Főoldal'],
  ['/szolgaltatasok/', 'Szolgáltatások'],
  ['/galeria/', 'Galéria'],
  ['/feluletkezeles/', 'Felületkezelés'],
  ['/rolam/', 'Rólam'],
  ['/kapcsolat/', 'Kapcsolat'],
];

function head({ title, desc, current, kulcsszavak, jsonld = [] }) {
  const navLinks = NAV.map(([href, label]) =>
    `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  const kanonikus = URL_ALAP + (current === '/' ? '/' : current);
  const ogKep = URL_ALAP + '/img/og.jpg';
  const ldSorok = jsonld.map((o) =>
    `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');

  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${esc(SITE.company)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${esc(kanonikus)}">
<meta name="theme-color" content="#1b1a18">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:url" content="${esc(kanonikus)}">
<meta property="og:image" content="${esc(ogKep)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogKep)}">
<link rel="preload" href="/assets/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
${ldSorok}
</head>
<body>
<a class="skip" href="#main">Ugrás a tartalomra</a>
<header class="site-head" id="top">
  <div class="wrap head-in">
    <a class="brand" href="/" aria-label="${esc(SITE.name)} — főoldal"><svg viewBox="0 0 618 284" aria-hidden="true" focusable="false"><path fill="currentColor" d="M227,0L284,0L284,284C127,284 0,157 0,0L57,0C57,106 129,195 227,220L227,0ZM391,284L335,284L335,0C491,0 618,127 618,284L561,284C561,178 489,89 391,64L391,284Z"/></svg><span class="brand-text"><b>VASDESIGN</b><span>${esc(SITE.tagline.split(',')[0])}</span></span></a>
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
        <b><svg viewBox="0 0 618 284" aria-hidden="true" focusable="false"><path fill="currentColor" d="M227,0L284,0L284,284C127,284 0,157 0,0L57,0C57,106 129,195 227,220L227,0ZM391,284L335,284L335,0C491,0 618,127 618,284L561,284C561,178 489,89 391,64L391,284Z"/></svg>VASDESIGN</b>
        <p>Egyedi tervezésű vas- és kovácsoltvas elemek, valamint fürdők belsőépítészeti kialakítása.</p>
      </div>
      <div class="foot-col">
        <h4>Oldalak</h4>
        <ul>
          <li><a href="/szolgaltatasok/">Szolgáltatások</a></li>
          <li><a href="/galeria/">Galéria</a></li>
          <li><a href="/feluletkezeles/">Felületkezelés</a></li>
          <li><a href="/rolam/">Rólam</a></li>
          <li><a href="/kapcsolat/">Kapcsolat</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>Termékek</h4>
        <ul>
          ${TERMEKEK.map((t) => `<li><a href="/${t.slug}/">${esc(t.nav)}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div class="foot-col">
        <h4>Elérhetőség</h4>
        <ul>
          <li>${telefon()}</li>
          <li>${emailTitkositott()}</li>
          <li>${esc(SITE.address)}</li>
          <li>${esc(SITE.company)}</li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} ${esc(SITE.company)} — ${esc(SITE.name)}. Minden jog fenntartva.</span>
      <a href="/adatkezeles/">Adatkezelési tájékoztató</a>
    </div>
  </div>
</footer>
<a class="call-fab tel-link" href="#" rel="nofollow" data-t="${esc(kodol(SITE.phoneHref))}" aria-label="Hívás"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/></svg>Hívás</a>
<script src="/assets/site.js" defer></script>
<script data-goatcounter="https://kiazami.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body>
</html>`;

// ---------- JSON-LD (strukturált adatok a Google-hoz) ----------
function vallalasLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: SITE.name,
    legalName: SITE.company,
    description: SITE.tagline,
    url: URL_ALAP + '/',
    image: URL_ALAP + '/img/og.jpg',
    logo: URL_ALAP + '/img/logo-lockup.svg',
    priceRange: 'Egyedi árajánlat alapján',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.addressStreet,
      addressLocality: SITE.addressCity,
      postalCode: SITE.addressZip,
      addressCountry: 'HU',
    },
    areaServed: { '@type': 'City', name: 'Budapest' },
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Szolgáltatások',
      itemListElement: C.services.map((s, i) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.short },
        position: i + 1,
      })),
    },
  };
}

// ---------- szolgáltatáskártya ----------
// Vonalrajz azokhoz a szolgáltatásokhoz, amelyekhez még nincs saját fotó.
const ILLU = {
  fence: `<svg viewBox="0 0 240 140" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
    <path d="M10 118h220M10 40h220M10 104h220"/>
    ${Array.from({ length: 11 }, (_, i) => { const x = 20 + i * 20; return `<path d="M${x} 124V34"/><path d="M${x - 5} 34l5-12 5 12"/>`; }).join('')}
    <circle cx="60" cy="72" r="10"/><circle cx="120" cy="72" r="10"/><circle cx="180" cy="72" r="10"/></svg>`,
};
// szolgáltatás → termékoldal(ak)
const TERMEK_LINK = {
  'terelvalasztok-ajtok': ['vas-uveg-ajto'],
  'galeriak': ['loft-galeria'],
  'kulteri-vasszerkezetek': ['kovacsoltvas-kerites', 'korlat'],
};
function svcCard(s) {
  const f = galImgs(s.img)[0];
  const fig = f
    ? `<figure><img ${kepAttr(f, altFor(f, s.img))} loading="lazy" decoding="async"></figure>`
    : `<figure class="illu">${ILLU[s.illu] || ''}</figure>`;
  return `
    <a class="card" href="${TERMEK_LINK[s.slug] ? '/' + TERMEK_LINK[s.slug][0] + '/' : '/szolgaltatasok/#' + esc(s.slug)}">
      ${fig}
      <div class="card-body">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.short)}</p>
        <span class="more">Részletek</span>
      </div>
    </a>`;
}
const GAL_KAT = [
  ['galeria', 'Vas galériák, lépcsők'],
  ['ajtok', 'Vas-üveg ajtók, térelválasztók'],
  ['kulter', 'Kerítések, kapuk, korlátok, előtetők'],
  ['referencia-lakas', 'Belsőépítészet, lakásátalakítás'],
  ['furdoszoba', 'Mini wellness fürdőszobák'],
  ['terasz', 'Belvárosi teraszok'],
];
const FOTO_DB = GAL_KAT.reduce((n, [cat]) => n + galKepek(cat).length, 0);

// ---------- lapok ----------
function homePage() {
  const vasKartyak = C.services.filter((s) => s.group === 'vas').map((s) => svcCard(s)).join('');
  const belKartyak = C.services.filter((s) => s.group !== 'vas').map((s) => svcCard(s)).join('');

  const pillars = C.pillars.map((p) => `
      <div class="pillar"><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></div>`).join('');

  const process = C.process.map((s) => `
      <div class="step"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join('');

  const ld = [
    vallalasLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: URL_ALAP + '/',
      inLanguage: 'hu',
      publisher: { '@type': 'Organization', name: SITE.company },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Főoldal', item: URL_ALAP + '/' }],
    },
  ];

  return head({
    title: `Kovácsoltvas kerítés, korlát, loft galéria | ${SITE.name}`,
    desc: 'Egyedi vas- és kovácsoltvas elemek tervezése, gyártása, beépítése: kerítés, kapu, korlát, loft galéria, vas-üveg ajtó, valamint wellness fürdők. Budapest.',
    kulcsszavak: 'vas design, kovácsoltvas, vas-üveg ajtó, térelválasztó, loft galéria, kerítés, kapu, korlát, ablakrács, előtető, porfestés, horganyzás, mini wellness fürdőszoba, belvárosi terasz, lakásátalakítás, belsőépítészet Budapest, egyedi fém design, Aura Home Design',
    current: '/',
    jsonld: ld,
  }) + `
<section class="hero hero-dark">
  <div class="wrap hero-grid">
    <div>
      <h1>Vas, kovácsoltvas, üveg és fa — romantikustól a minimalistáig.</h1>
      <p class="lede">Galériák, lépcsők, vas-üveg ajtók és térelválasztók a lakásba; kerítések, kapuk, korlátok, rácsok és előtetők. Mindez egyedi tervezéssel — és ha kell, a teljes belsőépítészettel együtt.</p>
      <div class="btn-row">
        <a class="btn" href="/kapcsolat/#ajanlatkeres">Ajánlatot kérek</a>
        <a class="btn ghost" href="/galeria/">Munkáim megtekintése</a>
      </div>
    </div>
    <div class="hero-figure">
      <img src="/img/opt/${esc(kep('kulter-lepcsokorlat-kovacsoltvas.webp', galImgs('galeria')[0]))}" alt="Díszes kovácsoltvas lépcsőkorlát csigavonalas korlátvéggel, Budapest" title="${esc(SITE.name)} — kovácsoltvas lépcsőkorlát" width="1535" height="1440" style="object-position:75% 50%" fetchpriority="high" decoding="async">
    </div>
  </div>
</section>

<section class="tone">
  <div class="wrap">
    <div class="section-head center">
      <h2>Szolgáltatások</h2>
      <p class="lede">Az ötlettől a beépítésig — minden, ami vasból, üvegből és szenvedéllyel készül.</p>
    </div>
    <div class="group-head"><h3>Vasszerkezetek — bent és kint</h3><p>a fő profil</p></div>
    <div class="grid grid-3">${vasKartyak}</div>
    <div class="group-head"><h3>Belsőépítészet</h3><p>a vas köré szervezett terek</p></div>
    <div class="grid grid-3 small">${belKartyak}</div>
  </div>
</section>

<section class="dark">
  <div class="wrap about-grid">
    <div>
      <p class="eyebrow">Felületkezelés</p>
      <h2>A vas elemek felületkezeléséről</h2>
      <p class="lede">Beltérben a megjelenés, kültéren a tartósság a döntő. A porfestéstől a tűzihorganyzáson át a nyers, viaszolt acélig összegyűjtöttem, mikor melyiket érdemes választani.</p>
      <div class="btn-row"><a class="btn" href="/feluletkezeles/">Felületkezelési útmutató</a></div>
    </div>
    <ul class="tips">
      <li><b>Beltér:</b> porfestés, vascsillám festék, nyers acél viasszal vagy lakkal, patinázás.</li>
      <li><b>Kültér:</b> tűzihorganyzás, duplex rendszer (horganyzás + porfestés), többrétegű korrózióvédő festés.</li>
      <li><b>Különleges anyagok:</b> corten (időjárásálló) acél és rozsdamentes acél.</li>
      <li>Az előkészítés (szemcseszórás, zsírtalanítás) adja a tartósság nagy részét.</li>
    </ul>
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
      <img src="/img/opt/${esc(kep('belvarosi-teraszok-img-7438.webp', galImgs('terasz')[0]))}" alt="Napfényes, növényekkel teli belvárosi terasz pihenősarokkal" title="Természet és nyugalom a belvárosban" width="1000" height="1250" loading="lazy" decoding="async">
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
    <p class="lede">Írjon vagy hívjon — egy fotó és néhány méret már elég az első egyeztetéshez.</p>
    <div class="btn-row" style="justify-content:center">
      ${telefon('btn', 'Hívás')}
      <a class="btn ghost" href="/kapcsolat/">Kapcsolat</a>
    </div>
  </div>
</section>` + foot();
}

const GYIK = [
  ['Mennyibe kerül egy egyedi vas elem?', 'Minden munka egyedi, ezért az ár a mérettől, a szerkezettől, az anyagoktól és a felületkezeléstől függ. A helyszíni felmérés után írásos árajánlatot adok.'],
  ['Mennyi idő az elkészítés?', 'A gyártási időt az árajánlatban rögzítjük. Kültéri elemeknél a tűzihorganyzás külön üzemben történik, ez pár nappal megnövelheti az átfutást.'],
  ['Kell-e engedély vagy statikus a galériához?', 'A galéria födémhez és falhoz rögzül, ezért a terhelhetőséget és a rögzítési pontokat már a tervezéskor átnézzük. Társasházban és nagyobb szerkezetnél érdemes statikus szakvéleményt kérni — ebben is segítek.'],
  ['Milyen belmagasság kell egy állógalériához?', 'Kényelmes, kétszintes használathoz körülbelül 4 méter vagy annál magasabb belmagasság ideális.'],
  ['Kültéren elég a porfestés?', 'Porfestés önmagában is véd, de egy sérülésnél a rozsda a festés alá kúszhat. Kerítéshez, kapuhoz, erkélykorláthoz a tűzihorganyzás + porfestés (duplex) rendszer a legtartósabb.'],
  ['Vállal régi vasszerkezet felújítását?', 'Igen: tisztítás, rozsdamentesítés, javítás és újrafestés — vagy, ha megéri, új felületkezelés. A felméréskor megmondom, melyik a gazdaságosabb.'],
];

function servicesPage() {
  const blocks = C.services.map((s, i) => {
    const g = gallery(s.img, { limit: 6 });
    return `
<section id="${esc(s.slug)}" class="${i % 2 ? 'tone' : ''}">
  <div class="wrap">
    <div class="about-grid">
      <div${i % 2 ? ' style="order:2"' : ''}>
        <p class="eyebrow">0${i + 1} · ${s.group === 'vas' ? 'Vasszerkezet' : 'Belsőépítészet'}</p>
        <h2>${esc(s.title)}</h2>
        <p class="lede">${esc(s.short)}</p>
        <p>${esc(s.body)}</p>${s.group === 'vas' && s.img === 'kulter' ? '\n        <p><a href="/feluletkezeles/">Melyik felületkezelés mire való?</a></p>' : ''}
        <div class="btn-row">${(TERMEK_LINK[s.slug] || []).map((sl) => `<a class="btn" href="/${sl}/">${esc(TERMEKEK.find((t) => t.slug === sl).nav)}</a>`).join('')}<a class="btn ghost" href="/kapcsolat/#ajanlatkeres">Árajánlatot kérek</a></div>
      </div>
      <div${i % 2 ? ' style="order:1"' : ''}>${g || ''}</div>
    </div>
  </div>
</section>`;
  }).join('');

  const ld = [
    vallalasLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Főoldal', item: URL_ALAP + '/' },
        { '@type': 'ListItem', position: 2, name: 'Szolgáltatások', item: URL_ALAP + '/szolgaltatasok/' },
      ],
    },
  ];

  return head({
    title: `Szolgáltatások: vas, galéria, kerítés, fürdő | ${SITE.name}`,
    desc: 'Vas-üveg ajtók, loft galériák, kerítések, korlátok, előtetők, valamint wellness fürdők, teraszok és lakásfelújítás egyedi tervezéssel, Budapesten.',
    kulcsszavak: 'vas-üveg ajtó, térelválasztó, loft galéria, kerítés, kapu, korlát, ablakrács, előtető, mini wellness fürdőszoba, belvárosi terasz, lakásátalakítás, felújítás, design polc, lámpa, csillár, kovácsoltvas',
    current: '/szolgaltatasok/',
    jsonld: [...ld, faqLd(GYIK)],
  }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow">Szolgáltatások</p>
    <h1>Profilunk</h1>
    <p class="lede">A térelválasztótól a kerítésig, a galériától a teljes lakásátalakításig — minden, ami vas, üveg és egyedi tervezés.</p>
  </div>
</section>` + blocks + `
<section class="tone" id="gyik">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">GYIK</p><h2>Gyakori kérdések</h2></div>
    <div class="faq">${GYIK.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>` + foot();
}

function galleryPage() {
  const cats = GAL_KAT;
  const secs = cats.map(([cat, label]) => {
    const n = galKepek(cat).length;
    if (!n) return '';
    return `
<section class="tight" data-gal-cat="${esc(cat)}">
  <div class="wrap">
    <div class="section-head">
      <h2>${esc(label)}</h2>
      <p class="note" data-gal-count="${esc(cat)}">${n} fotó</p>
    </div>
    ${gallery(cat)}
  </div>
</section>`;
  }).join('\n');

  const total = FOTO_DB;

  const ld = [{
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Főoldal', item: URL_ALAP + '/' },
      { '@type': 'ListItem', position: 2, name: 'Galéria', item: URL_ALAP + '/galeria/' },
    ],
  }];

  return head({
    title: `Galéria: kovácsoltvas és vas design munkák | ${SITE.name}`,
    desc: 'Referenciák: kovácsoltvas kerítések, kapuk, korlátok, loft galériák, vas-üveg ajtók, wellness fürdők és belvárosi teraszok fotókon.',
    kulcsszavak: 'vasdesign galéria, referenciamunkák, portfólió, kovácsoltvas munkák, vas design fotók, wellness fürdőszoba galéria',
    current: '/galeria/',
    jsonld: ld,
  }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow">Portfólió</p>
    <h1>Galéria</h1>
    <p class="lede">Válogatás a kész munkákból — keressen a képek között, vagy kattintson a nagy nézethez.</p>
  </div>
</section>
<section class="tight">
  <div class="wrap">
    <form class="gal-keres" role="search" id="gal-keres">
      <label class="sr-only" for="gal-q">Keresés a galériában</label>
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="search" id="gal-q" name="q" placeholder="Keresés: terasz, fürdőszoba, galéria, IMG_2421…" autocomplete="off">
      <button type="button" class="gal-torol" id="gal-torol" hidden>Törlés</button>
    </form>
    <div class="gal-allas" role="group" aria-label="Szűrés kategória szerint" id="gal-kategoriak">
      <button type="button" class="on" data-cat="osszes">Mind (${total})</button>
      ${cats.map(([cat, label]) => `<button type="button" data-cat="${esc(cat)}">${esc(label)} (${galKepek(cat).length})</button>`).join('\n      ')}
    </div>
    <p class="gal-hint" id="gal-hint" role="status" aria-live="polite"></p>
  </div>
</section>` + secs + foot();
}

function aboutPage() {
  const ld = [
    vallalasLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Főoldal', item: URL_ALAP + '/' },
        { '@type': 'ListItem', position: 2, name: 'Rólam', item: URL_ALAP + '/rolam/' },
      ],
    },
  ];

  return head({
    title: `Rólam: 20+ év vas design tapasztalat | ${SITE.name}`,
    desc: 'Több mint 20 év tapasztalat egyedi vas- és kovácsoltvas elemek, valamint belsőépítészet tervezésében és kivitelezésében Budapesten.',
    kulcsszavak: 'vas design készítő, kovácsoltvas szakember, belsőépítész Budapest, több mint 20 év tapasztalat, egyedi fém tervezés',
    current: '/rolam/',
    jsonld: ld,
  }) + `
<section class="hero">
  <div class="wrap about-grid">
    <div class="about-figure">
      <img src="/img/opt/${esc(kep('belvarosi-teraszok-img-7438.webp', galImgs('terasz')[0]))}" alt="Napfényes, növényekkel teli belvárosi terasz pihenősarokkal" title="Természet és nyugalom a belvárosban" width="1000" height="1250" fetchpriority="high" decoding="async">
    </div>
    <div>
      <p class="eyebrow">Rólam</p>
      <h1>${esc(C.quote)}</h1>
      <p class="lede">${esc(C.about)}</p>
      <p>A minimál és hightech építészet hatására divatba jöttek a kovácsoltvas és vas design elemek, vasból készült bútorok, ajtók, térelválasztók és lakáskiegészítők. ${esc(SITE.yearSince)} óta tervezek és készítek ilyen elemeket — a galériától a kerítésig —, és mivel a tervezés és a kivitelezés egy kézben van, a részletek nem vesznek el útközben.</p>
      <figure class="aside-fig">
        <img src="/img/opt/${esc(kep('kovacsolt-rozsak-muhely.webp'))}" alt="Kovácsolt vas rózsák a műhelyben, festés előtt" width="1600" height="1200" loading="lazy" decoding="async">
        <figcaption>Kovácsolt rózsák a műhelyből</figcaption>
      </figure>
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

// ---------- Adatkezelési tájékoztató (vázlat – jogi átnézésre) ----------
function privacyPage() {
  const sor = (cim, ...p) => `<h2>${esc(cim)}</h2>` + p.map((x) => `<p>${x}</p>`).join('');
  return head({
    title: `Adatkezelési tájékoztató | ${SITE.name}`,
    desc: `A ${SITE.name} weboldal ajánlatkérő űrlapján megadott adatok kezelése: milyen adatot, mire, meddig és kinek a közreműködésével kezelünk.`,
    current: '/adatkezeles/',
  }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow">Jogi információ</p>
    <h1>Adatkezelési tájékoztató</h1>
    <p class="lede">Ez a tájékoztató azt írja le, mi történik az ajánlatkérő űrlapon megadott adatokkal.</p>
  </div>
</section>
<section class="tight">
  <div class="wrap jogi">
    ${sor('Az adatkezelő', `${esc(SITE.company)} (${esc(SITE.name)})<br>Cím: ${esc(SITE.address)}<br>E-mail: ${emailTitkositott()}`)}
    ${sor('Milyen adatokat kezelünk?', 'Az ajánlatkérő űrlapon megadott nevet, e-mail címet, telefonszámot (ha megadja), valamint az ajánlatkéréshez megadott adatokat: a kért munka típusát, méretét, helyét, a felületkezelést és az üzenet szövegét.')}
    ${sor('Mire használjuk?', 'Kizárólag az ajánlatkérés megválaszolására, a felmérés és az árajánlat egyeztetésére. Hírlevelet nem küldünk, az adatokat harmadik félnek nem adjuk el.')}
    ${sor('Mi az adatkezelés jogalapja?', 'Az Ön hozzájárulása (GDPR 6. cikk (1) bekezdés a) pont), amelyet az űrlap elküldésekor a jelölőnégyzettel ad meg. A hozzájárulást bármikor visszavonhatja egy e-mailben; ez nem érinti a visszavonás előtti adatkezelés jogszerűségét.')}
    ${sor('Meddig őrizzük az adatokat?', 'Az ajánlatkérés lezárását követő 1 évig. Ha az ajánlatkérésből megrendelés lesz, az adatokat a szerződéshez és a számviteli jogszabályokhoz szükséges ideig őrizzük.')}
    ${sor('Kik férnek hozzá az adatokhoz?', 'Az adatokat kizárólag mi kezeljük. Az űrlap tárolásához és az értesítő e-mailekhez a Google szolgáltatásait használjuk (Google Űrlap, Google Táblázat, Gmail; Google Ireland Limited), a weboldalt a GitHub Pages szolgáltatja (GitHub, Inc.). A látogatottságot a GoatCounter méri, sütik és személyes adatok tárolása nélkül.')}
    ${sor('Milyen jogai vannak?', 'Kérheti, hogy tájékoztassuk az Önről kezelt adatokról, kérheti azok helyesbítését, törlését vagy kezelésük korlátozását, illetve az adatok átadását (adathordozhatóság). Kérését a fenti e-mail címre küldheti; 30 napon belül válaszolunk.')}
    ${sor('Hová fordulhat panasszal?', 'Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), 1055 Budapest, Falk Miksa utca 9–11., <a href="https://www.naih.hu" rel="noopener">www.naih.hu</a>. Bírósághoz is fordulhat; a pert a lakóhelye szerinti törvényszék előtt is megindíthatja.')}
    <p class="note">Hatályos: ${new Date().toISOString().slice(0, 10)}.</p>
  </div>
</section>` + foot();
}

function contactPage() {
  const ld = [{
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Kapcsolat — ' + SITE.name,
    url: URL_ALAP + '/kapcsolat/',
    mainEntity: {
      '@type': 'LocalBusiness',
      name: SITE.name,
        address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.addressStreet,
        addressLocality: SITE.addressCity,
        postalCode: SITE.addressZip,
        addressCountry: 'HU',
      },
    },
  }];

  return head({
    title: `Kapcsolat, ajánlatkérés | ${SITE.name}`,
    desc: `Kérjen ajánlatot kerítésre, korlátra, loft galériára vagy vas-üveg ajtóra. Személyes egyeztetés: ${SITE.address}.`,
    kulcsszavak: 'ajánlatkérés, kapcsolat, vas design rendelés, kovácsoltvas megrendelés, Budapest belváros',
    current: '/kapcsolat/',
    jsonld: ld,
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
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/></svg>
            <span><span class="k">Telefon</span>${telefon('v')}</span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
            <span><span class="k">E-mail</span>${emailTitkositott('v mail-link')}</span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span><span class="k">Cím</span><span class="v">${esc(SITE.address)}</span></span></li>
        </ul>
      </div>
      <div id="ajanlatkeres">
        <form class="ajanlat-form" novalidate data-action="${esc(SITE.urlap.action)}" data-mezok="${esc(JSON.stringify(SITE.urlap.mezok))}">
          <div class="field"><label for="nev">Név</label><input id="nev" name="nev" type="text" required autocomplete="name"></div>
          <div class="field-row">
            <div class="field"><label for="email">E-mail cím</label><input id="email" name="email" type="email" required autocomplete="email"></div>
            <div class="field"><label for="telefon">Telefonszám <span class="note">(nem kötelező)</span></label><input id="telefon" name="telefon" type="tel" autocomplete="tel"></div>
          </div>
          <div class="hp" aria-hidden="true"><label for="weboldal">Ezt a mezőt hagyja üresen</label><input id="weboldal" name="weboldal" type="text" tabindex="-1" autocomplete="off"></div>
          <div class="field-row">
            <div class="field"><label for="tipus">Mire kér ajánlatot?</label><select id="tipus" name="tipus">
              ${['Galéria, lépcső', 'Vas-üveg ajtó, térelválasztó', 'Kerítés, kapu', 'Korlát', 'Ablakrács, biztonsági rács', 'Előtető', 'Polc, bútor, egyéb vas elem', 'Fürdőszoba, terasz, lakásátalakítás', 'Régi vasszerkezet felújítása'].map((x) => `<option>${esc(x)}</option>`).join('')}
            </select></div>
            <div class="field"><label for="meret">Hozzávetőleges méret</label><input id="meret" name="meret" type="text" placeholder="pl. 12 fm kerítés, 1,1 m magas"></div>
          </div>
          <fieldset class="choice"><legend>Hová kerül?</legend>
            <label><input type="radio" name="hely" value="Beltér" checked> Beltér</label>
            <label><input type="radio" name="hely" value="Kültér"> Kültér</label>
            <label><input type="radio" name="hely" value="Párás tér (fürdő)"> Párás tér</label>
          </fieldset>
          <div class="field"><label for="felulet">Felületkezelés</label><select id="felulet" name="felulet">
            ${['Még nem tudom, kérek javaslatot', 'Porfestés', 'Tűzihorganyzás + porfestés (duplex)', 'Tűzihorganyzás', 'Nyers acél, viasz vagy lakk', 'Kovácsoltvas-hatású / vascsillám festés', 'Patinázott, antik hatás', 'Corten acél', 'Rozsdamentes acél'].map((x) => `<option>${esc(x)}</option>`).join('')}
          </select><span class="note"><a href="/feluletkezeles/">Melyik mire való?</a></span></div>
          <div class="field"><label for="uzenet">Üzenet</label><textarea id="uzenet" name="uzenet" rows="5" required placeholder="Stílus, szín, határidő, helyszín (kerület)…"></textarea></div>
          <label class="consent"><input type="checkbox" name="adatkezeles" value="${esc(SITE.urlap.hozzajarulas)}" required> <span>Elolvastam az <a href="/adatkezeles/">adatkezelési tájékoztatót</a>, és hozzájárulok, hogy az adataimat az ajánlatkérés megválaszolásához kezeljék.</span></label>
          <button class="btn" type="submit">Ajánlatkérés küldése</button>
          <p class="form-status" role="status" aria-live="polite" hidden></p>
          <p class="note">Fotót vagy vázlatot a válaszlevelemre küldhet. Telefonon is elérhető vagyok: ${telefon()}.</p>
        </form>
      </div>
    </div>
  </div>
</section>` + foot();
}

function feluletPage() { return feluletLap({ head, foot, esc, URL_ALAP, SITE }); }

// ---------- mentés + SEO fájlok ----------
async function write(rel, html) {
  // Belső hivatkozások alapútvonal-elve (GitHub Pages: /vasdesign/...);
  // helyi előnézetnél BASE üres, tehát minden a gyökérben marad.
  if (BASE) {
    html = html
      .replace(/href="\//g, `href="${BASE}/`)
      .replace(/src="\//g, `src="${BASE}/`)
      .replace(/srcset="([^"]*)"/g, (m, v) => `srcset="${v.replace(/(^|, )\//g, `$1${BASE}/`)}"`);
  }
  const p = path.join(OUT, rel);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, html);
}

await write('index.html', homePage());
await write('szolgaltatasok/index.html', servicesPage());
await write('galeria/index.html', galleryPage());
await write('feluletkezeles/index.html', feluletPage());
for (const t of TERMEKEK) await write(t.slug + '/index.html', termekLap(t, { head, foot, esc, URL_ALAP, SITE, galleryFiles, galKepek, telefon }));
await write('rolam/index.html', aboutPage());
await write('kapcsolat/index.html', contactPage());
await write('adatkezeles/index.html', privacyPage());

// 404 (GitHub Pages automatikusan ezt szolgálja ki)
await write('404.html', head({
  title: `Az oldal nem található — ${SITE.name}`,
  desc: 'Az oldal nem található.',
  current: '/404',
}) + `
<section class="hero">
  <div class="wrap section-head">
    <p class="eyebrow">404</p>
    <h1>Ez az oldal nem található</h1>
    <p class="lede">Lehet, hogy elírás történt, vagy az oldalt átneveztük.</p>
    <div class="btn-row">
      <a class="btn" href="/">Vissza a főoldalra</a>
      <a class="btn ghost" href="/kapcsolat/">Kapcsolat</a>
    </div>
  </div>
</section>` + foot());

// robots.txt + sitemap.xml
const ma = new Date().toISOString().slice(0, 10);
const lapok = [
  ['/', '1.0'],
  ['/szolgaltatasok/', '0.9'],
  ['/galeria/', '0.8'],
  ['/feluletkezeles/', '0.8'],
  ...TERMEKEK.map((t) => ['/' + t.slug + '/', '0.9']),
  ['/rolam/', '0.6'],
  ['/kapcsolat/', '0.8'],
  ['/adatkezeles/', '0.3'],
];
await writeFile(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${URL_ALAP}/sitemap.xml\n`);
await writeFile(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  lapok.map(([u, pr]) =>
    `  <url><loc>${URL_ALAP}${u}</loc><lastmod>${ma}</lastmod><changefreq>monthly</changefreq><priority>${pr}</priority></url>`).join('\n') +
  `\n</urlset>\n`);
// Jekyll tiltás a GitHub Pages-en (a .gitignore-ban lévő mappák miatt is jó)
await writeFile(path.join(OUT, '.nojekyll'), '');

console.log(`✓ ${8 + TERMEKEK.length} oldal + sitemap.xml + robots.txt + 404.html generálva`);
console.log('  képek kategóriánként:', Object.entries(CAT).map(([k, v]) => `${k}=${v.length}`).join(', '));

// ---------- duplikált képek ellenőrzése ----------
// A galéria ugyanaz a kép több WordPress-galériából is származhat; a
// `dedup.mjs` (a `galeria-review.mjs` vizuális döntőjével) a kiválasztott
// példányt tartja meg. Ez a lépés megbuktatja a buildet, ha duplikátum
// maradna bent a megjelenő kategóriákban – a méretváltozatokat is.
{
  const { createHash } = await import('node:crypto');
  const { readFile } = await import('node:fs/promises');
  const { existsSync } = await import('node:fs');
  const { fotokulcs } = await import('./galeria-kulcs.mjs');
  // csak azok a kategóriák, amelyek megjelennek az oldalon
  const GAL_KATEGORI = ['referencia-lakas', 'furdoszoba', 'galeria', 'terasz', 'ajtok', 'kulter', 'muhely'];
  const seen = new Map();
  const fotok = new Map();
  const dupes = [];
  for (const cat of GAL_KATEGORI) {
    for (const x of CAT[cat] ?? []) {
      const p = path.join(PUB, 'img', 'opt', x.file);
      if (!existsSync(p)) { dupes.push(`${cat}:${x.file} (fájl nincs)`); continue; }
      const h = createHash('md5').update(await readFile(p)).digest('hex');
      if (!seen.has(h)) seen.set(h, []);
      seen.get(h).push(`${cat}:${x.file}`);
      // a méretváltozat: ugyanaz a fotó más fájlnévvel
      const fk = fotokulcs(x.file);
      if (!fotok.has(fk)) fotok.set(fk, []);
      fotok.get(fk).push(`${cat}:${x.file}`);
    }
  }
  for (const [, list] of seen) if (list.length > 1) dupes.push(list.join(' == '));
  for (const [fk, list] of fotok) if (list.length > 1) dupes.push(list.join(' == '));
  if (dupes.length) {
    console.error('✗ duplikált kép van az adatcsomagban:');
    for (const d of dupes) console.error('   ' + d);
    console.error('  Döntsd el a galeria-review.mjs-sel, majd: node dedup.mjs');
    process.exit(1);
  }
  console.log('✓ ellenőrzés: nincs duplikált kép a galériában');
}
