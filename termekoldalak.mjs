// Vasdesign — termékaloldalak (SEO): egy oldal = egy fő keresési téma.
// A build.mjs hívja; a képek a data/by-category.json fájlneveire hivatkoznak.

export const TERMEKEK = [
  {
    slug: 'kovacsoltvas-kerites',
    nav: 'Kerítések, kapuk',
    title: 'Kovácsoltvas kerítés és kapu Budapesten | Vasdesign',
    desc: 'Egyedi kovácsoltvas kerítések, kétszárnyú kapuk, kiskapuk és előtetők tervezése, gyártása és beépítése. Régi kerítések felújítása is. Kérjen ajánlatot!',
    h1: 'Kovácsoltvas kerítések, kapuk és előtetők',
    lede: 'Egyedi tervezésű kerítések, kétszárnyú kapuk, kiskapuk és előtetők — a díszes, szecessziós kovácsoltvastól a letisztult, pálcás kialakításig.',
    kepek: ['kulter-szecesszios-kerites.webp', 'kulter-ketszarnyu-kapu.webp', 'kulter-kiskapu.webp', 'kulter-eloteto-cimer.webp'],
    reszek: [
      ['Az épülethez tervezve', [
        'A kerítés az épület első benyomása. Régi bérház, polgári villa vagy modern családi ház: a mintát, az arányokat és a díszítést az épület stílusához tervezem — a lándzsahegyes, leveles díszektől a szecessziós ívekig vagy egy egyszerű, pálcás kialakításig.',
        'A kerítésmezők, a kapuk és a kiskapu egységes rendszerben készülnek, így a teljes utcafront összhangban marad. A bejárat fölé illő kovácsoltvas előtető ugyanebből a formavilágból tervezhető.',
      ]],
      ['Mire figyelünk a tervezéskor?', null, [
        'a magasság, a lábazat és az oszlopok kiosztása',
        'a pálcák távolsága, hogy gyerek vagy kisállat ne férjen át',
        'a kapu nyitásiránya, a pántok, a zár és a kilincs',
        'a postaláda, a csengő és a kaputelefon helye',
        'meglévő kerítésnél: felújítható-e, vagy új elem készüljön',
      ]],
      ['Felújítás és pótlás', [
        'Régi kovácsoltvas kerítésnél sokszor megéri a felújítás: tisztítás, rozsdamentesítés, a sérült vagy hiányzó elemek pótlása a meglévő minta alapján, majd új felületkezelés. A felméréskor megmondom, melyik a gazdaságosabb: a felújítás vagy az új gyártás.',
      ]],
    ],
    felulet: 'Kültéren a tartósságot a felületkezelés dönti el. Kerítéshez és kapuhoz a tűzihorganyzás és porfestés együtt (duplex rendszer) a legtartósabb; régi kerítés felújításánál korrózióvédő alapozó és fedőfesték is jó megoldás lehet.',
    gyik: [
      ['Felújítható a régi kovácsoltvas kerítés?', 'Igen. A rozsdát eltávolítjuk, a sérült vagy hiányzó elemeket a meglévő minta alapján pótoljuk, majd új felületkezelést kap. A felméréskor kiderül, hogy a felújítás vagy az új gyártás éri meg jobban.'],
      ['Kell engedély az utcafronti kerítéshez?', 'Ez a helyi építési szabályoktól függ (például a megengedett magasságtól), társasháznál pedig a közösség hozzájárulása is kellhet. Érdemes ezt a tervezés elején ellenőrizni; ebben is segítek.'],
      ['Mennyi idő alatt készül el egy kerítés vagy kapu?', 'A gyártási időt az árajánlatban rögzítjük. Ha a kerítés tűzihorganyzást kap, az külön üzemben történik, ez néhány nappal növelheti az átfutást.'],
      ['Milyen színű lehet a kerítés?', 'A klasszikus a matt fekete vagy a grafit, de porfestéssel szinte bármilyen RAL-szín elérhető, és a fényesség (matt, selyemfényű) is választható.'],
    ],
  },
  {
    slug: 'korlat',
    nav: 'Lépcső- és erkélykorlátok',
    title: 'Kovácsoltvas lépcsőkorlát, erkélykorlát | Vasdesign',
    desc: 'Egyedi lépcsőkorlátok, erkélykorlátok és francia erkélyek kültérre és beltérre, díszes kovácsoltvastól a minimál acélpálcás korlátig. Budapest.',
    h1: 'Lépcső- és erkélykorlátok, francia erkélyek',
    lede: 'Kültéri és beltéri korlátok díszes kovácsoltvasból vagy letisztult acélpálcákból — méretre tervezve, a helyszínen beépítve.',
    kepek: ['kulter-lepcsokorlat-kovacsoltvas.webp', 'kulter-francia-erkely.webp', 'kulter-korlatelem-muhely.webp', 'loft-galeria-img-2336-2.webp'],
    reszek: [
      ['Biztonság és látvány egyszerre', [
        'A korlát elsősorban biztonsági elem: megfelelő magasság, szilárd rögzítés és olyan pálcatávolság kell, amelyen gyerek sem fér át. Ezen belül a forma szabadon alakítható: csigavonalas korlátvég, levél- és virágdíszek, vagy egyszerű, függőleges pálcák.',
      ]],
      ['Francia erkély', [
        'Ahol nincs erkélylemez, csak padlóig érő ablak vagy erkélyajtó, a francia erkély ad biztonságot, és egyben homlokzati dísz is. A korlátelemeket a műhelyben készítem el és kezelem felületileg, majd a helyszínen rögzítem: a képeken ugyanaz a minta előbb a műhelyben, aztán a homlokzaton látható.',
      ]],
      ['Beltéri korlátok', [
        'Galériákhoz és belső lépcsőkhöz acélpálcás vagy laposacél korlátot tervezek, fa vagy acél kapaszkodóval. A korlát a lépcső és a galéria szerkezetével együtt készül, így egységes a megjelenés.',
      ]],
    ],
    felulet: 'Kültéri korláthoz a tűzihorganyzás és porfestés együtt (duplex rendszer) vagy a rozsdamentes acél a legtartósabb; a fogódzó készülhet rozsdamentes acélból vagy fából. Beltérben porfestés vagy lakkozott nyers acél a jellemző.',
    gyik: [
      ['Milyen magas legyen a korlát?', 'A korlát magasságát a vonatkozó előírások és a helyszín (lépcső, erkély, galéria) alapján határozzuk meg; a felméréskor ezt pontosan megbeszéljük.'],
      ['Hogyan rögzül a korlát a kőhöz vagy a betonhoz?', 'Oldalról (a lépcső vagy a födém homlokához) vagy felülről, a járófelületbe. A rögzítés módját a szerkezet és a burkolat ismeretében választjuk ki, hogy tartós és esztétikus legyen.'],
      ['Felújítható a régi korlát?', 'Igen: tisztítás, rozsdamentesítés, javítás és új felületkezelés. Ha egy elem hiányzik, a meglévő minta alapján pótolható.'],
      ['Beltéri galériához is készül korlát?', 'Igen, a galéria szerkezetével együtt tervezem. Erről bővebben a loft galéria oldalon olvashat.'],
    ],
    kapcsolodo: ['loft-galeria'],
  },
  {
    slug: 'loft-galeria',
    nav: 'Loft galériák',
    title: 'Loft galéria, vas állógaléria Budapesten | Vasdesign',
    desc: 'Egyedi vas állógaléria magas belmagasságú lakásba: plusz háló vagy dolgozószoba a meglévő alapterületen. Lépcsővel, korláttal, beépítéssel.',
    h1: 'Loft galéria — egyedi vas állógaléria',
    lede: 'Magas belmagasságú lakásban egy vas állógaléria plusz szintet ad: háló, dolgozósarok vagy vendégágy a meglévő alapterületen.',
    kat: 'galeria',
    reszek: [
      ['Mikor érdemes galériát építeni?', [
        'Kényelmes, kétszintes használathoz körülbelül 4 méter vagy annál nagyobb belmagasság ideális — ez a belvárosi polgári lakásokban gyakori. A galéria alatt és fölött is használható tér marad: lent nappali vagy gardrób, fent háló vagy iroda.',
      ]],
      ['Szerkezet, lépcső, korlát', [
        'A galéria fekete acél vázra épül, fa járófelülettel. A lépcső lehet egyenes vagy lebegő fokú, a korlát acélpálcás vagy laposacél. Az állógaléria saját lábakon áll, vagy falhoz és födémhez rögzül; a terhelhetőséget és a rögzítési pontokat már a tervezéskor átnézzük, szükség esetén statikus szakember bevonásával.',
      ]],
      ['Egy kézben a tervezéstől a beépítésig', [
        'A galériát a lakás méreteire és a használatra tervezem, a műhelyben gyártom, és a helyszínen építem be. Ha kell, a teljes belsőépítészetet — világítást, burkolatot, bútorokat — is egy kézben tartom.',
      ]],
    ],
    felulet: 'Beltérben a matt fekete vagy antracit porfestés a legelterjedtebb; loft hangulathoz a lakkozott vagy viaszolt nyers acél is szép választás.',
    gyik: [
      ['Milyen belmagasság kell egy állógalériához?', 'Kényelmes, kétszintes használathoz körülbelül 4 méter vagy annál magasabb belmagasság ideális.'],
      ['Kell statikus vagy engedély a galériához?', 'A galéria födémhez és falhoz rögzül, ezért a terhelhetőséget már a tervezéskor átnézzük. Társasházban és nagyobb szerkezetnél érdemes statikus szakvéleményt kérni — ebben is segítek.'],
      ['Milyen lépcső illik a galériához?', 'Egyenes vagy lebegő fokú acél lépcső, fa fokokkal; kis alapterületen meredekebb, helytakarékos lépcső is tervezhető.'],
      ['Mennyi idő alatt készül el?', 'A gyártási és beépítési időt az árajánlatban rögzítjük, a felmérés után.'],
    ],
    kapcsolodo: ['korlat'],
  },
  {
    slug: 'vas-uveg-ajto',
    nav: 'Vas-üveg ajtók',
    title: 'Vas-üveg ajtó, vaskeretes üvegfal | Vasdesign',
    desc: 'Egyedi vaskeretes üvegajtók, üvegfalak és fém térelválasztók: elválasztják a tereket, de átengedik a fényt. Tervezés, gyártás, beépítés Budapesten.',
    h1: 'Vas-üveg ajtók és térelválasztók',
    lede: 'Vaskeretes üvegajtók, üvegfalak és polcos fém térelválasztók, amelyek elválasztják a tereket, de átengedik a fényt.',
    kat: 'ajtok',
    reszek: [
      ['Több fény, tágasabb tér', [
        'A vékony fekete keret és a nagy üvegfelület a kisebb lakást is tágasabbnak mutatja: a konyha, a dolgozósarok vagy a háló leválasztható úgy, hogy a nappali fénye megmaradjon. A fém keret karakteresebbé, kicsit rusztikusabbá teszi az üveget.',
      ]],
      ['Típusok', null, [
        'nyíló vagy toló vas-üveg ajtó',
        'fix vaskeretes üvegfal, akár ajtóval egybeépítve',
        'polcos vagy pálcás fém térelválasztó',
        'víztiszta, szatinált vagy bordázott üveggel',
      ]],
      ['Méretre tervezve', [
        'Minden ajtó és üvegfal a helyszíni méretekre készül, az osztásokat és a profilokat a lakás stílusához igazítom — a romantikustól a minimalistáig.',
      ]],
    ],
    felulet: 'Beltérben a matt fekete vagy antracit porfestés a jellemző; párás helyiségbe (fürdőbe) horganyzott vagy rozsdamentes alapot javaslok.',
    gyik: [
      ['Fürdőszobába is készülhet vas-üveg fal?', 'Igen, de párás térben horganyzott vagy rozsdamentes alap és ennek megfelelő felületkezelés kell, hogy a keret ne rozsdásodjon.'],
      ['Milyen üveget érdemes választani?', 'Ahol a fény a fontos, víztiszta üveget; ahol a belátás zavarna (háló, fürdő), szatinált vagy bordázott üveget.'],
      ['Nyíló vagy toló ajtó legyen?', 'A toló ajtó helyet takarít meg, a nyíló ajtó jobban zár. A felméréskor a tér és a használat alapján javaslok megoldást.'],
    ],
  },
];

export function termekLap(t, { head, foot, esc, URL_ALAP, SITE, galleryFiles, galKepek }) {
  const kepek = t.kat ? galKepek(t.kat) : t.kepek;
  const reszek = t.reszek.map(([cim, bek, lista]) => `
      <h2>${esc(cim)}</h2>
      ${(bek || []).map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      ${lista ? `<ul class="tips">${lista.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}`).join('');
  const kapcs = (t.kapcsolodo || []).map((s) => TERMEKEK.find((x) => x.slug === s)).filter(Boolean)
    .map((x) => `<a href="/${x.slug}/">${esc(x.nav)}</a>`).join(' · ');

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: t.h1,
      description: t.desc,
      areaServed: { '@type': 'City', name: 'Budapest' },
      provider: { '@type': 'HomeAndConstructionBusiness', name: SITE.name, telephone: SITE.phoneHref, url: URL_ALAP + '/' },
      url: URL_ALAP + '/' + t.slug + '/',
    },
    faqLd(t.gyik),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Főoldal', item: URL_ALAP + '/' },
        { '@type': 'ListItem', position: 2, name: 'Szolgáltatások', item: URL_ALAP + '/szolgaltatasok/' },
        { '@type': 'ListItem', position: 3, name: t.nav, item: URL_ALAP + '/' + t.slug + '/' },
      ],
    },
  ];

  return head({ title: t.title, desc: t.desc, current: '/' + t.slug + '/', jsonld: ld }) + `
<section class="hero tight">
  <div class="wrap section-head">
    <p class="eyebrow"><a href="/szolgaltatasok/">Szolgáltatások</a> / ${esc(t.nav)}</p>
    <h1>${esc(t.h1)}</h1>
    <p class="lede">${esc(t.lede)}</p>
    <div class="btn-row"><a class="btn" href="/kapcsolat/#ajanlatkeres">Ajánlatot kérek</a><a class="btn ghost" href="tel:${esc(SITE.phoneHref)}">${esc(SITE.phone)}</a></div>
  </div>
</section>
<section class="tight">
  <div class="wrap">${galleryFiles(kepek)}</div>
</section>
<section class="tone">
  <div class="wrap about-grid termek-szoveg">
    <div>${reszek}
    </div>
    <aside class="rec">
      <span class="where">Felületkezelés</span>
      <p>${esc(t.felulet)}</p>
      <p><a href="/feluletkezeles/">Melyik felületkezelés mire való?</a></p>
      ${kapcs ? `<p class="note">Kapcsolódó: ${kapcs}</p>` : ''}
    </aside>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">GYIK</p><h2>Gyakori kérdések</h2></div>
    <div class="faq">${t.gyik.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    <div class="btn-row"><a class="btn" href="/kapcsolat/#ajanlatkeres">Ajánlatot kérek</a></div>
  </div>
</section>` + foot();
}

export function faqLd(gyik) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: gyik.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}
