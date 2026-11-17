// Vasdesign — „Felületkezelés” útmutató oldal (a build.mjs hívja).
// A tartalom itt, adatként van: így a táblázatok könnyen bővíthetők.

const ELOKESZITES = [
  ['Mechanikus tisztítás', 'Drótkefézés, csiszolás (St 2–St 3 tisztasági fok). Felújításnál és helyszíni festésnél.'],
  ['Szemcseszórás (homokszórás)', 'Sa 2½ tisztasági fok: eltávolítja a revét és a rozsdát, érdes felületet ad, amin a bevonat jól tapad. A tartós rendszerek alapja.'],
  ['Zsírtalanítás, foszfátozás', 'Vegyi előkezelés porfestés előtt: a konverziós réteg javítja a tapadást és késlelteti az alározsdásodást.'],
  ['Hegesztési varratok előkészítése', 'Varratcsiszolás, élek lekerekítése, salak és fröccsenések eltávolítása — az éleken és varratokon indul a rozsda.'],
];

const BELTER = [
  ['Porfestés', 'poliészter vagy epoxi-poliészter por, kemencében beégetve', 'Galéria, ajtó- és térelválasztó-keret, polc, korlát', 'A legelterjedtebb. Matt, selyemfényű vagy struktúrált (pl. antracit fémcsillám) felület, egyenletes és kopásálló.'],
  ['Alapozó + zománcfesték', 'oldószeres vagy vizes rendszer, ecsettel/szórással', 'Lépcső, felújítás, egyedi szín', 'Helyszínen is készülhet és javítható; olcsóbb, de kevésbé ellenálló, mint a porfestés.'],
  ['Kovácsoltvas-hatású / vascsillám festék', 'egyrétegű, „direkt rozsdára” típusú festék', 'Kovácsoltvas, romantikus stílus', 'Kalapácsütéses vagy csillámos hatás; alapozás és fedés egyben.'],
  ['Nyers acél viasszal vagy olajjal', 'méhviasz, kemény viasz, lenolaj alapú szerek', 'Loft galéria, bútor, polc', 'Látszik a hengerlési reve és a hegesztés — ipari, „loft” karakter. Csak száraz térbe, időnként újraviaszolni kell.'],
  ['Nyers acél átlátszó lakkal', '2 komponensű poliuretán (PU) lakk, matt', 'Térelválasztó, korlát, fogantyú', 'Megőrzi a nyers acél látványát, véd az ujjnyomtól és a foltosodástól.'],
  ['Patinázás, barnítás', 'vegyi feketítés/barnítás, utána viasz vagy lakk', 'Dísz- és kovácsoltvas elemek', 'Antik, sötétbarna–fekete, élénk tónusjátékú felület.'],
  ['Galvanikus bevonat', 'cink, nikkel, króm, sárgaréz-hatás', 'Vasalat, kilincs, kisalkatrész', 'Díszes fémes felület kis méretű elemekre.'],
  ['Rozsdahatás (lezárt oxidréteg)', 'kontrollált oxidáció, majd lakk', 'Dísz, falburkolat', 'Corten-hatás beltérben, lepergés és foltosodás nélkül.'],
];

const KULTER = [
  ['Tűzihorganyzás', '25–50+ év', 'Kerítés, kapu, korlát, rács, előtető', 'Olvadt cinkfürdőbe mártás (MSZ EN ISO 1461). A legtartósabb; szürke, kissé foltos fémes megjelenés.'],
  ['Duplex: tűzihorganyzás + porfestés', '40–60+ év', 'Kerítés, kapu, erkélykorlát', 'A kültéri „prémium” megoldás: a cink véd, a festék színt ad és a cinket is óvja. A horganyzott felületet a festés előtt elő kell készíteni.', 'ajánlott'],
  ['Szórt cink (metallizálás) + fedőfestés', '20–30 év', 'Nagy vagy helyben lévő szerkezet', 'Akkor jó, ha az elem nem fér a horganyzókádba, vagy nem szerelhető le.'],
  ['Többrétegű korrózióvédő festés', '15–25 év', 'Helyszíni festés, felújítás', 'Cinkpor-tartalmú alapozó + epoxi közbenső réteg + poliuretán fedőréteg (MSZ EN ISO 12944 szerint tervezve).'],
  ['Kültéri porfestés horganyzás nélkül', '8–15 év', 'Kevésbé igénybe vett elemek', 'UV-álló poliészter por. Olcsóbb, de egy sérülésnél a rozsda a festés alá kúszhat.'],
  ['Alapozó + alkid vagy akril zománc', '3–8 év', 'Régi kerítések felújítása', 'Hagyományos, könnyen javítható, de rendszeresen újra kell festeni.'],
  ['Corten (időjárásálló) acél', 'évtizedek', 'Kerítéspanel, virágtartó, dísz', 'Nem kap festést: stabil, nemes rozsdapatina alakul ki rajta. A lecsorgó víz foltot hagyhat a burkolaton.'],
  ['Rozsdamentes acél', 'élettartam', 'Korlát, fogódzó, üvegkorlát-tartó', 'Csiszolt, polírozott vagy szemcseszórt felület. Sózott út vagy medence közelében savállóbb (A4) minőség javasolt.'],
];

const AJANLAS = [
  ['Beltér', 'Galéria, lépcső', 'Szemcseszórás → porfestés (matt antracit, fekete vagy vascsillám). Loft stílusban nyers acél lakkal vagy viasszal.'],
  ['Beltér', 'Vas-üveg ajtó, térelválasztó', 'Porfestés, vékony profilon gyakran finom struktúrával (pl. matt fekete, antracit). Fürdőben horganyzott vagy rozsdamentes alap.'],
  ['Beltér', 'Polc, bútor', 'Porfestés, vagy nyers acél matt PU-lakkal.'],
  ['Kültér', 'Kerítés, kapu', 'Tűzihorganyzás + porfestés (duplex). Takarékosabb: porfestés horganyzás nélkül. Felújításnál: alapozó + zománc.'],
  ['Kültér', 'Erkély- és lépcsőkorlát', 'Duplex rendszer vagy rozsdamentes acél; a fogódzó rozsdamentes vagy fa.'],
  ['Kültér', 'Ablak- és ajtórács', 'Tűzihorganyzás + porfestés, vagy alapozó + kovácsoltvas-hatású festék a romantikus stílushoz.'],
  ['Kültér', 'Előtető', 'Horganyzott és porfestett szerkezet, rozsdamentes csavarokkal, a víz elvezetésére tervezett profilvégekkel.'],
  ['Kültér', 'Kovácsoltvas díszkerítés', 'Horganyzás + festés; hagyományosan alapozó + matt fekete vagy grafit festés, aranyozott vagy patinázott díszekkel.'],
];

const TIPPEK = [
  'Kültéren a zárt profilok végét le kell zárni, hogy ne álljon meg bennük a víz — horganyzáshoz viszont szellőzőfuratok kellenek.',
  'A karcolás a kültéri rozsdásodás fő oka: évente érdemes átnézni a szerkezetet, és a sérüléseket javítófestékkel lezárni.',
  'Porfestett felületet enyhe, semleges tisztítószerrel tisztítson; súrolószert és oldószert ne használjon.',
  'Nyers, viaszolt acélt csak száraz térben használjon, és évente-kétévente viaszolja újra.',
  'A színt RAL-színminta alapján választjuk; a fényességi fok (matt, selyemfényű, fényes) ugyanolyan fontos, mint a szín.',
];

export function feluletLap({ head, foot, esc, URL_ALAP, SITE }) {
  const sor4 = (r) => `<tr><td>${esc(r[0])}${r[4] ? `<span class="tag">${esc(r[4])}</span>` : ''}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`;
  const sorK = (r) => `<tr><td>${esc(r[0])}${r[4] ? `<span class="tag">${esc(r[4])}</span>` : ''}</td><td class="life">${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`;

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Vas elemek felületkezelése beltérben és kültéren',
      inLanguage: 'hu',
      author: { '@type': 'Organization', name: SITE.company },
      publisher: { '@type': 'Organization', name: SITE.name },
      mainEntityOfPage: URL_ALAP + '/feluletkezeles/',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Főoldal', item: URL_ALAP + '/' },
        { '@type': 'ListItem', position: 2, name: 'Felületkezelés', item: URL_ALAP + '/feluletkezeles/' },
      ],
    },
  ];

  return head({
    title: `Vas felületkezelés: porfestés, horganyzás | ${SITE.name}`,
    desc: 'Milyen felületkezelést kapjon a kerítés, korlát, galéria vagy ajtó? Porfestés, tűzihorganyzás, duplex rendszer, patina, corten — beltér és kültér.',
    kulcsszavak: 'vas felületkezelés, porfestés, tűzihorganyzás, duplex bevonat, kerítés festés, korlát felületkezelés, kovácsoltvas festék, nyers acél lakk, corten acél, rozsdamentes korlát',
    current: '/feluletkezeles/',
    jsonld: ld,
  }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow">Útmutató</p>
    <h1>Vas elemek felületkezelése</h1>
    <p class="lede">Ugyanaz a vasszerkezet beltérben évtizedekig hibátlan maradhat, kültéren viszont pár év alatt megrozsdásodhat — ha nem a helyéhez illő felületet kapja. Összegyűjtöttem, mikor melyik megoldást érdemes választani.</p>
    <nav class="toc" aria-label="Tartalom">
      <a href="#elokeszites">Előkészítés</a><a href="#belter">Beltér</a><a href="#kulter">Kültér</a><a href="#mit-mire">Mit mire?</a><a href="#apolas">Ápolás</a>
    </nav>
  </div>
</section>

<section class="tight" id="elokeszites">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">01</p><h2>Előkészítés — minden rendszer alapja</h2>
      <p class="lede">A bevonat tartósságának nagy része azon múlik, milyen tiszta és érdes felületre kerül.</p></div>
    <div class="recs">${ELOKESZITES.map(([t, d]) => `<div class="rec"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="tone" id="belter">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">02 · Beltér</p><h2>Beltéri felületek</h2>
      <p class="lede">Száraz lakótérben (C1–C2 korróziós kategória) a megjelenés a fő szempont; párás helyiségben (fürdő) érdemes kültéri szintű védelmet választani.</p></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Megoldás</th><th>Anyag, technológia</th><th>Tipikus felhasználás</th><th>Jellemző</th></tr></thead>
      <tbody>${BELTER.map(sor4).join('')}</tbody>
    </table></div>
  </div>
</section>

<section id="kulter">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">03 · Kültér</p><h2>Kültéri felületek</h2>
      <p class="lede">Budapesten a legtöbb helyszín C3 korróziós kategória; forgalmas, sózott út mellett C4. Itt a tartósság a döntő.</p></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Megoldás</th><th>Élettartam*</th><th>Tipikus felhasználás</th><th>Jellemző</th></tr></thead>
      <tbody>${KULTER.map(sorK).join('')}</tbody>
    </table></div>
    <p class="note">* Irányadó érték az első nagyobb felújításig; a környezettől, a rétegvastagságtól és a karbantartástól függ.</p>
  </div>
</section>

<section class="tone" id="mit-mire">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">04</p><h2>Mit mire szoktak használni?</h2>
      <p class="lede">Galériák, ajtók, kerítések, korlátok és rácsok — a bevált párosítások.</p></div>
    <div class="recs">${AJANLAS.map(([hol, mi, d]) => `<div class="rec"><span class="where">${esc(hol)}</span><h3>${esc(mi)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="dark" id="apolas">
  <div class="wrap about-grid">
    <div>
      <p class="eyebrow">05</p>
      <h2>Gyakorlati tanácsok és ápolás</h2>
      <p class="lede">Nem tudja, melyik illik az Ön eleméhez? A felméréskor együtt kiválasztjuk — az ajánlatkérőben jelölheti, hogy javaslatot kér.</p>
      <div class="btn-row"><a class="btn" href="/kapcsolat/#ajanlatkeres">Ajánlatot kérek</a></div>
    </div>
    <ul class="tips">${TIPPEK.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  </div>
</section>` + foot();
}
