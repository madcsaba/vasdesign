# Vasdesign

Egyedi tervezésű vas- és kovácsoltvas elemek, térelválasztók, galériák és mini wellness
fürdőszobák. Statikus oldal, GitHub Pages-en – **Aura Home Design Kft.**

**Élő oldal:** https://madcsaba.github.io/vasdesign/

## Oldalak

- `/` – főoldal
- `/szolgaltatasok/` – vas-üveg ajtók, galériák, fürdőszobák, teraszok, lakásátalakítás
- `/galeria/` – a portfólió, **keresővel és kategóriaszűrővel**
- `/rolam/`, `/kapcsolat/` – bemutatkozás és ajánlatkérés

## Fájlok

| Fájl | Szerep |
|---|---|
| `build.mjs` | a `data/` tartalmából generálja a `public/` oldalakat (SEO, JSON-LD, sitemap) |
| `data/content.json` | a szövegek, a szolgáltatások, az elérhetőségek |
| `data/by-category.json` | a kategóriánkénti képadatok (fájlnév, méret, WordPress-azonosító) |
| `data/alt.json` | képenkénti alt-szövegek (SEO, akadálymentesség) |
| `termekoldalak.mjs` | a termékaloldalak (kerítés, korlát, loft galéria, vas-üveg ajtó) tartalma |
| `kiskepek.py` | 640 px-es kisképek a `public/img/opt/thumb/` mappába (új kép után futtatandó) |
| `dedup.mjs` | a duplikált képek kivétele (a legrégebbi WordPress-feltöltés marad) |
| `galeria-review.mjs` | **helyi vizuális döntő** a duplikátumokról (méretekkel) |
| `public/` | a generált oldalak és a képek |
| `raw/` | a WordPress-oldal nyers adatai (nem verziókevelt) |

## Működtetés

```bash
node build.mjs                 # az oldalak generálása a public/ mappába
node galeria-review.mjs        # a duplikátumok átnézése böngészőben (localhost:8799)
node dedup.mjs                 # a duplikátumok kivétele a döntés alapján
```

A `build.mjs` **megbukik**, ha duplikált kép marad a galériában – így a duplikátumok
nem kerülhetnek vissza egy későbbi feltöltéssel.

## A képek eredete

A galéria a korábbi WordPress-oldalról származik: ugyanaz a fotó több galériában is
feltöltve volt, méretváltozatokkal (`-727x1024` bélyegképek). A `data/by-category.json`
minden bejegyzésben megőrzi az eredeti WordPress-azonosítót (`wpId`), így a régebbi
feltöltés azonosítható – a `dedup.mjs` alapértelmezés szerint azt tartja meg.

## Megjegyzés

A cégnév **Aura Home Design Kft.**; a weboldalon a kész munkák láthatók, a válaszadás
a megadott elérhetőségeken történik.
