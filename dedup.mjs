#!/usr/bin/env node
/**
 * Duplikált képek kivétele a galériából – a döntés alapján.
 *
 * A kozhang.hu/vasdesign.hu galéria több WordPress-galériából származik, és
 * ugyanaz a kép több helyen is felbukkant (a WordPress ugyanazt a fájlt újra
 * feltöltötte egy másik galériába). A `raw/downloaded.json` tartalmazza az
 * eredeti WordPress-feltöltéseket `id` és `src` mezővel – a kisebb `id`
 * a régebbi feltöltés, tehát az az „eredeti" fotó.
 *
 * Alapértelmezés: minden duplikátum-csoportból a legrégebbi (eredeti)
 * feltöltés marad. A `data/dedupe-döntés.json` felülírhatja ezt: a fájlban
 * a `kategória|fájlnév` kulcs `true` (megtartandó) vagy `false` (törlendő)
 * értéke adható meg – ezt a `galeria-review.mjs` vizuális eszköz írja.
 *
 * Használat:
 *   node dedup.mjs            → a duplikátumokat kiveszi (a döntésfájllal együtt)
 *   node dedup.mjs --dry      → csak megmutatja, mit törölne
 *   node dedup.mjs --default  → a döntésfájlt figyelmen kívül hagyja,
 *                                és minden csoportból a legrégebbit tartja
 */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const KAT = path.join(ROOT, 'data', 'by-category.json');
const OPT = path.join(ROOT, 'public', 'img', 'opt');
const DON = path.join(ROOT, 'data', 'dedupe-döntés.json');
const DRY = process.argv.includes('--dry');
const DEFAULT = process.argv.includes('--default');

const md5 = (buf) => createHash('md5').update(buf).digest('hex');
const kulcs = (cat, file) => `${cat}|${file}`;

/** A WordPress-feltöltés azonosítója a fájlnév alapján (.jpg / .jpeg / .png). */
const eredetiNev = (webp) => webp.replace(/\.webp$/, '.jpg');

async function main() {
  const data = JSON.parse(await readFile(KAT, 'utf8'));
  // A WordPress-feltöltés adatai a `data/by-category.json` `wpId`/`wpSrc` mezőiben
  // vannak (a `raw/` mappa nem része a repónak).
  const byFile = new Map();
  for (const list of Object.values(data)) {
    for (const x of list) {
      if (x.wpId == null) continue;
      byFile.set(x.file.replace(/\.webp$/, '.jpg'), { id: x.wpId, src: x.wpSrc });
    }
  }

  let dontes = {};
  let kategoriak = {};
  if (!DEFAULT && existsSync(DON)) {
    try {
      const f = JSON.parse(await readFile(DON, 'utf8'));
      dontes = f.dontes ?? f;
      kategoriak = f.kategoriak ?? {};
    }
    catch (e) { console.error(`✗ a döntésfájl nem olvasható: ${e.message}`); process.exit(1); }
  }

  // --- a képtartalom-hash alapján a duplikátum-csoportok ---
  const hashMap = new Map(); // hash -> [{cat, file}]
  for (const [cat, list] of Object.entries(data)) {
    for (const x of list) {
      const p = path.join(OPT, x.file);
      if (!existsSync(p)) continue;
      const h = md5(await readFile(p));
      if (!hashMap.has(h)) hashMap.set(h, []);
      hashMap.get(h).push({ cat, file: x.file });
    }
  }
  const csoportok = [...hashMap.values()].filter((g) => g.length > 1);
  if (!csoportok.length) {
    console.log('✓ nincs duplikált kép');
    return;
  }

  const wpId = (f) => byFile.get(eredetiNev(f))?.id ?? Infinity;
  const torolando = new Map(); // "cat|file" -> maradó "cat|file"

  console.log(`=== ${csoportok.length} duplikált csoport, ${csoportok.reduce((n, g) => n + g.length, 0)} fájl ===\n`);

  for (const g of csoportok) {
    // alapértelmezés: a legrégebbi WordPress-feltöltés marad
    const rendezett = [...g].sort((a, b) => wpId(a.file) - wpId(b.file));
    let marad = rendezett[0];

    // a vizuális döntés felülírhatja
    const kivalasztott = g.filter((e) => dontes[kulcs(e.cat, e.file)] === true);
    if (kivalasztott.length === 1) marad = kivalasztott[0];
    else if (kivalasztott.length > 1) {
      console.error(`✗ a(z) ${g[0].file} csoportban több "megtartandó" van: ` +
        kivalasztott.map((e) => e.file).join(', '));
      process.exit(1);
    }

    const info = byFile.get(eredetiNev(marad.file));
    const forras = info?.src?.match(/uploads\/(\d{4}\/\d{2})/)?.[1] ?? '';
    console.log(`MARAD: ${marad.file}  [${marad.cat}]  WP id=${info?.id ?? '?'}  ${forras}`);
    for (const e of g) {
      if (e === marad) continue;
      torolando.set(kulcs(e.cat, e.file), kulcs(marad.cat, marad.file));
      const ei = byFile.get(eredetiNev(e.file));
      const ef = ei?.src?.match(/uploads\/(\d{4}\/\d{2})/)?.[1] ?? '';
      console.log(`  TÖRLÖS: ${e.file}  [${e.cat}]  WP id=${ei?.id ?? '?'}  ${ef}`);
    }
    console.log('');
  }

  if (DRY) {
    console.log('(--dry: semmi nem módosult)');
    return;
  }

  // --- a kategóriákból kiveszük a duplikátumokat ---
  let kivont = 0;
  for (const [cat, list] of Object.entries(data)) {
    const uj = list.filter((x) => !torolando.has(kulcs(cat, x.file)));
    kivont += list.length - uj.length;
    data[cat] = uj;
  }

  // --- a kiválasztott képek kategóriájának áthelyezése ---
  let athelyezve = 0;
  for (const [k, ujKat] of Object.entries(kategoriak)) {
    const [regiKat, file] = k.split('|');
    if (!data[regiKat]) continue;
    const idx = data[regiKat].findIndex((x) => x.file === file);
    if (idx < 0) continue;
    if (!data[ujKat]) data[ujKat] = [];
    data[ujKat].push(data[regiKat].splice(idx, 1)[0]);
    athelyezve++;
    console.log(`✓ ${file}: ${regiKat} → ${ujKat}`);
  }

  await writeFile(KAT, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ data/by-category.json: ${kivont} duplikált bejegyzés kivéve` + (athelyezve ? `, ${athelyezve} kép áthelyezve` : ''));

  // --- a fájlok törlése ---
  // Csak akkor töröljük a fájlt, ha a bejegyzése sehol nem maradt – ugyanaz
  // a fájl több kategóriában is szerepelhet (pl. a fooldal és az ajtok).
  let torolt = 0;
  const megmaradtFajlok = new Set();
  for (const list of Object.values(data)) for (const x of list) megmaradtFajlok.add(x.file);
  for (const k of torolando.keys()) {
    const f = k.split('|')[1];
    if (megmaradtFajlok.has(f)) continue;
    const p = path.join(OPT, f);
    if (existsSync(p)) { await unlink(p); torolt++; }
  }
  console.log(`✓ public/img/opt/: ${torolt} fájl törölve`);

  // --- ellenőrzés: nem maradt duplikátum a galérián ---
  const GAL_KATEGORI = ['referencia-lakas', 'furdoszoba', 'galeria', 'terasz', 'ajtok'];
  const marad = new Map();
  for (const cat of GAL_KATEGORI) {
    for (const x of data[cat] ?? []) {
      const p = path.join(OPT, x.file);
      if (!existsSync(p)) continue;
      const h = md5(await readFile(p));
      if (!marad.has(h)) marad.set(h, []);
      marad.get(h).push(`${cat}:${x.file}`);
    }
  }
  const haVan = [...marad.values()].filter((g) => g.length > 1);
  if (haVan.length) {
    console.error('✗ még van duplikátum:');
    for (const g of haVan) console.error('   ' + g.join(' == '));
    process.exit(1);
  }
  console.log('✓ ellenőrzés: nincs megmaradt duplikátum a galérián');
}

await main();
