#!/usr/bin/env node
/**
 * Duplikált képek kivétele a galériából.
 *
 * A kozhang.hu/vasdesign.hu galéria több WordPress-galériából származik, és
 * ugyanaz a kép több helyen is felbukkant (a WordPress ugyanazt a fájlt újra
 * feltöltötte egy másik galériába). A `raw/downloaded.json` tartalmazza az
 * eredeti WordPress-feltöltéseket `id` és `src` mezővel — a kisebb `id`
 * a régebbi feltöltés, tehát az az „eredeti" fotó.
 *
 * A script:
 *   1. kiszámolja a képtartalom-hash alapján a duplikátum-csoportokat;
 *   2. minden csoportban a legkisebb WordPress-id-jú (legrégebbi) képet tartja meg;
 *   3. törli a többi fajl belevételét a `data/by-category.json`-ból;
 *   4. törli a fájlokat a `public/img/opt/` mappából.
 *
 * Használat: node dedup.mjs [--dry]   (--dry: csak mutatja, mit törölne)
 */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const KAT = path.join(ROOT, 'data', 'by-category.json');
const OPT = path.join(ROOT, 'public', 'img', 'opt');
const DRY = process.argv.includes('--dry');

const md5 = (buf) => createHash('md5').update(buf).digest('hex');

/** A WordPress-feltöltés azonosítója a fájlnév alapján (.jpg / .jpeg / .png). */
const eredetiNev = (webp) => webp.replace(/\.webp$/, '.jpg');

async function main() {
  const data = JSON.parse(await readFile(KAT, 'utf8'));
  const dl = JSON.parse(await readFile(path.join(ROOT, 'raw', 'downloaded.json'), 'utf8'));
  const byFile = new Map(dl.map((x) => [x.file, x]));

  // --- a kategóriákban szereplő képek hash-e ---
  const files = new Set();
  for (const list of Object.values(data)) for (const x of list) files.add(x.file);

  const hashMap = new Map(); // hash -> [file]
  for (const f of files) {
    const p = path.join(OPT, f);
    if (!existsSync(p)) continue;
    const h = md5(await readFile(p));
    if (!hashMap.has(h)) hashMap.set(h, []);
    hashMap.get(h).push(f);
  }

  const dupGroups = [...hashMap.values()].filter((g) => g.length > 1);
  if (!dupGroups.length) {
    console.log('✓ nincs duplikált kép');
    return;
  }

  // --- a WordPress-id alapján a legrégebbi (eredeti) kép ---
  const wpId = (f) => byFile.get(eredetiNev(f))?.id ?? Infinity;
  const torolando = new Map(); // file -> maradó fájl
  const maradok = [];

  for (const g of dupGroups) {
    const sorted = [...g].sort((a, b) => wpId(a) - wpId(b));
    const keep = sorted[0];
    maradok.push({ keep, drop: sorted.slice(1), id: wpId(keep) });
    for (const d of sorted.slice(1)) torolando.set(d, keep);
  }

  console.log(`=== ${dupGroups.length} duplikált csoport, ${torolando.size} törlendő fájl ===\n`);
  for (const m of maradok) {
    const info = byFile.get(eredetiNev(m.keep));
    console.log(`MARAD: ${m.keep}`);
    console.log(`       WordPress id=${m.id}  ${info?.src ?? '(ismeretlen forrás)'}`);
    for (const d of m.drop) {
      const di = byFile.get(eredetiNev(d));
      console.log(`TÖRLÖS: ${d}`);
      console.log(`       WordPress id=${di?.id ?? '?'}  ${di?.src ?? '(ismeretlen forrás)'}`);
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
    const uj = list.filter((x) => !torolando.has(x.file));
    kivont += list.length - uj.length;
    data[cat] = uj;
  }
  await writeFile(KAT, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ data/by-category.json: ${kivont} duplikált bejegyzés kivéve`);

  // --- a fájlok törlése ---
  let torolt = 0;
  for (const f of torolando.keys()) {
    const p = path.join(OPT, f);
    if (existsSync(p)) { await unlink(p); torolt++; }
  }
  console.log(`✓ public/img/opt/: ${torolt} fájl törölve`);

  // --- ellenőrzés: nem maradt duplikátum a galérián ---
  // A `fooldal` és `lakasban` kategóriákat semmi nem jeleníti meg (dead
  // kategóriák), ezért ott a duplikáció nem számít – csak a galériaoldalon
  // és a szolgáltatások oldalán megjelenő kategóriákban.
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
