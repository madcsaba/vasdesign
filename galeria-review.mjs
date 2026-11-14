#!/usr/bin/env node
/**
 * Galéria-duplikátum döntő: helyi vizuális segéd.
 *
 * Megnyit egy helyi oldalt, ahol a galéria minden képe látható:
 *   – a pontosan azonos képek (byte-ra egyezőek) egymás mellett;
 *   – a méretváltozatok (a WordPress ugyanazt a fotót többször feltöltötte,
 *     eltérő vágással/mérettel) szintén egy csoportban;
 *   – minden példánynál látszik a pixelméret, a fájlméret és a WordPress-
 *     feltöltés dátuma.
 *
 * Kattintással kiválaszthatod, melyik példány maradjon, és a kiválasztott
 * példányt másik kategóriába is teheted. A „Mentés" gomb a választást a
 * `data/dedupe-döntés.json` fájlba írja és azonnal alkalmazza is
 * (a `dedup.mjs` segítségével).
 *
 * Használat: node galeria-review.mjs      (a böngésző megnyílik)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fotokulcs, webpDim, pixelCount } from './galeria-kulcs.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const KAT = path.join(ROOT, 'data', 'by-category.json');
const OPT = path.join(ROOT, 'public', 'img', 'opt');
const DON = path.join(ROOT, 'data', 'dedupe-döntés.json');
const PORT = 8799;

const CATEGORIAK = {
  'referencia-lakas': 'Belsőépítészet, lakásátalakítás',
  furdoszoba: 'Mini wellness fürdőszobák',
  galeria: 'Vas galériák',
  terasz: 'Belvárosi teraszok',
  ajtok: 'Vas-üveg ajtók',
  fooldal: 'Főoldal (jelenleg nincs használva)',
  lakasban: 'Lakásban (jelenleg nincs használva)',
};

// --- adatok összeállítása ---
const data = JSON.parse(await readFile(KAT, 'utf8'));
// a WordPress-feltöltés adatai a `data/by-category.json` `wpId`/`wpSrc` mezőiben
const byFile = new Map();
for (const list of Object.values(data)) {
  for (const x of list) {
    if (x.wpId == null) continue;
    byFile.set(x.file.replace(/\.webp$/, '.jpg'), { id: x.wpId, src: x.wpSrc });
  }
}

const hashMap = new Map();   // hash -> [bejegyzés]
const keyMap = new Map();    // fotókulcs -> [bejegyzés]
const fsBytes = new Map();   // fájlnév -> tartalom
const hashOf = new Map();    // fájlnév -> md5
for (const [cat, list] of Object.entries(data)) {
  for (const x of list) {
    const p = path.join(OPT, x.file);
    if (!existsSync(p)) continue;
    const buf = await readFile(p);
    const h = createHash('md5').update(buf).digest('hex');
    const dim = webpDim(buf);
    const bejegyzes = { cat, file: x.file, w: x.w, h: x.h, px: dim, bytes: buf.length };
    fsBytes.set(x.file, buf);
    hashOf.set(x.file, h);
    if (!hashMap.has(h)) hashMap.set(h, []);
    hashMap.get(h).push(bejegyzes);
    const fk = fotokulcs(x.file);
    if (!keyMap.has(fk)) keyMap.set(fk, []);
    keyMap.get(fk).push(bejegyzes);
  }
}

// a csoportok: azonos kép (hash) VAGY azonos fotó (méretváltozat)
const csoportok = [];
const maradtHash = new Set();
for (const [hash, list] of hashMap) {
  if (list.length < 2) continue;
  maradtHash.add(hash);
  csoportok.push({ tipus: 'azonos', hash, peldanyok: list });
}
// a méretváltozatok: azonos fotókulcs, de eltérő hash
for (const [fk, list] of keyMap) {
  if (list.length < 2) continue;
  if (list.every((e) => maradtHash.has(hashOf.get(e.file)))) continue;
  csoportok.push({ tipus: 'meretvaltozat', kulcs: fk, peldanyok: list });
}

// --- döntés betöltése ---
let dontes = {};
let kategoriak = {};
try {
  const f = JSON.parse(await readFile(DON, 'utf8'));
  dontes = f.dontes ?? f;
  kategoriak = f.kategoriak ?? {};
} catch {}

// --- a példányok előkészítése ---
const peldanyAdat = new Map(); // "cat|file" -> {...}
for (const c of csoportok) {
  for (const p of c.peldanyok) {
    const k = p.cat + '|' + p.file;
    const orig = p.file.replace(/\.webp$/, '.jpg');
    const wp = byFile.get(orig);
    const dátum = wp?.src?.match(/uploads\/(\d{4}\/\d{2})/)?.[1] ?? '';
    peldanyAdat.set(k, {
      ...p,
      url: '/img/opt/' + p.file,
      wpId: wp?.id ?? null,
      feltoltes: dátum,
      eredeti: wp?.src?.split('/').pop() ?? '',
      regi: !!dátum && dátum < '2020/01',
    });
  }
}

const csoportokAdat = csoportok.map((c) => ({
  tipus: c.tipus,
  peldanyok: c.peldanyok.map((p) => peldanyAdat.get(p.cat + '|' + p.file)),
}));

const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Galéria-duplikátum döntő</title>
<style>
  :root { --ink:#1a1d21; --dim:#6b7280; --line:#e3e6ea; --bg:#f7f8f9; --acc:#2563eb; --keep:#15803d; --drop:#b91c1c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  header { position:sticky; top:0; z-index:10; background:#fff; border-bottom:1px solid var(--line); padding:16px 24px; }
  h1 { margin:0 0 4px; font-size:21px; }
  .lead { margin:0; color:var(--dim); font-size:14px; }
  .wrap { max-width:1180px; margin:0 auto; padding:24px; }
  .bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:12px; }
  button { font:inherit; cursor:pointer; border-radius:8px; border:1px solid var(--line); background:#fff; padding:8px 14px; }
  button.primary { background:var(--acc); border-color:var(--acc); color:#fff; font-weight:600; }
  button:disabled { opacity:.5; cursor:default; }
  #allapot { font-size:14px; color:var(--dim); }
  .csoport { background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:18px; }
  .csoport h2 { margin:0 0 4px; font-size:17px; }
  .meta { color:var(--dim); font-size:13.5px; margin-bottom:14px; }
  .tipus { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
    padding:3px 8px; border-radius:5px; margin-right:8px; vertical-align:2px; }
  .tipus.azonos { background:#dbeafe; color:#1e40af; }
  .tipus.meretvaltozat { background:#fef3c7; color:#92400e; }
  .peldanyok { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:14px; }
  .peldany { border:2px solid var(--line); border-radius:12px; overflow:hidden; cursor:pointer; background:#fff; transition:border-color .15s; }
  .peldany.keep { border-color:var(--keep); }
  .peldany.drop { border-color:var(--drop); opacity:.5; }
  .peldany img { width:100%; height:170px; object-fit:cover; display:block; background:var(--line); }
  .peldany .info { padding:10px 12px; font-size:12.5px; }
  .peldany .nev { font-weight:600; word-break:break-all; margin-bottom:4px; font-size:12px; }
  .peldany .sor { color:var(--dim); }
  .peldany .meret { font-variant-numeric:tabular-nums; color:var(--ink); font-weight:600; }
  .cimke { display:inline-block; font-size:11px; padding:2px 7px; border-radius:5px; background:#eef1f5; color:#374151; margin:0 5px 6px 0; }
  .cimke.régi { background:#dcfce7; color:#14532d; }
  .cimke.új { background:#fee2e2; color:#7f1d1d; }
  .marka { font-weight:700; font-size:13px; margin-top:6px; }
  .keep .marka { color:var(--keep); } .drop .marka { color:var(--drop); }
  .katvaltas { margin-top:8px; }
  .katvaltas select { font:inherit; font-size:12px; padding:5px 7px; border-radius:7px; border:1px solid var(--line); width:100%; }
  .gomb { margin-top:14px; display:flex; gap:8px; flex-wrap:wrap; }
  .tipusmagy { color:var(--dim); font-size:13px; }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <h1>Galéria-duplikátum döntő</h1>
    <p class="lead">${csoportokAdat.length} csoport · ${csoportokAdat.reduce((n, c) => n + c.peldanyok.length, 0)} fájl. Kattints a képre: az első kattintás megtartja, a második törli, a harmadik törli a jelölést. A zöld keretű kép marad meg.</p>
    <div class="bar">
      <button class="primary" id="ment">Mentés és alkalmazás</button>
      <button id="vissza">Minden jelölés törlése</button>
      <span id="allapot"></span>
    </div>
  </div>
</header>
<div class="wrap" id="tartalom"></div>
<script>
const CSOPORT = ${JSON.stringify(csoportokAdat)};
const KATEGORIAK = ${JSON.stringify(CATEGORIAK)};
let dontes = ${JSON.stringify(dontes)};
let kategoriak = ${JSON.stringify(kategoriak)};

const kulcs = (p) => p.cat + "|" + p.file;
const kb = (b) => Math.round(b / 1024) + " KB";

function jeloles(p){
  const k = kulcs(p);
  if (dontes[k] === true) return "keep";
  if (dontes[k] === false) return "drop";
  return "";
}

function kovetkezo(){
  // a megmaradó képek kategóriánként
  const torol = new Set();
  for (const c of CSOPORT) {
    const kival = c.peldanyok.filter(x => dontes[kulcs(x)] === true);
    if (kival.length !== 1) continue;
    for (const p of c.peldanyok) if (p !== kival[0]) torol.add(kulcs(p));
  }
  const szam = {};
  for (const [cat, list] of Object.entries(${JSON.stringify(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.map((x) => x.file)])))})) {
    szam[cat] = list.filter(f => !torol.has(cat + "|" + f)).length;
  }
  // a kategóriát áthelyezett képek
  for (const [k, kat] of Object.entries(kategoriak)) {
    const [cat, file] = k.split("|");
    if (szam[cat] !== undefined) { szam[cat]--; szam[kat] = (szam[kat] || 0) + 1; }
  }
  return szam;
}

function aktual(){
  let tart = 0, torol = 0, dontott = 0;
  for (const c of CSOPORT) for (const p of c.peldanyok) {
    const k = kulcs(p);
    if (dontes[k] === false) torol++;
    else if (dontes[k] === true) tart++;
    else dontott++;
  }
  const sz = kovetkezo();
  const lista = Object.entries(sz).map(([k, v]) => (KATEGORIAK[k] || k) + ": " + v).join(" · ");
  document.getElementById("allapot").textContent =
    tart + " megtartandó, " + torol + " törölendő" +
    (dontott ? " · " + dontott + " még nincs eldöntve" : "") +
    (dontott ? "" : " → " + lista);
}

function render(){
  const t = document.getElementById("tartalom");
  t.innerHTML = CSOPORT.map((c, ci) => {
    const kival = c.peldanyok.filter(x => dontes[kulcs(x)] === true);
    const marad = kival.length === 1 ? kival[0] : null;
    return '<div class="csoport" data-ci="' + ci + '">' +
      '<h2><span class="tipus ' + c.tipus + '">' +
        (c.tipus === "azonos" ? "azonos kép" : "méretváltozat") + '</span>' + c.peldanyok.length + ' példány</h2>' +
      '<p class="meta">' + (c.tipus === "azonos"
        ? "A képtartalom pontosan egyezik – bármelyiket lehet megtartani."
        : "Ugyanaz a fotó eltérő méretben/vágással – itt érdemes a nagyobb, jobb minőségűt megtartani.") + '</p>' +
      '<div class="peldanyok">' +
      c.peldanyok.map((p, pi) => {
        const k = kulcs(p);
        const cls = dontes[k] === true ? "keep" : dontes[k] === false ? "drop" : (marad === p ? "keep" : "");
        const marka = dontes[k] === true ? "✓ MEGTARTANDÓ"
          : dontes[k] === false ? "✕ TÖRLENDŐ"
          : (marad === p ? "✓ MEGTARTANDÓ" : "— kattints");
        const px = p.px ? p.px.w + "×" + p.px.h + " px" : (p.w ? p.w + "×" + p.h + " px" : "ismeretlen méret");
        const kat = kategoriak[k] || p.cat;
        const opt = Object.keys(KATEGORIAK).map(x =>
          '<option value="' + x + '"' + (x === kat ? " selected" : "") + '>' + KATEGORIAK[x] + '</option>').join("");
        return '<div class="peldany ' + cls + '" data-ci="' + ci + '" data-pi="' + pi + '">' +
          '<img src="' + p.url + '" alt="">' +
          '<div class="info">' +
            '<span class="cimke ' + (p.regi ? "régi" : "új") + '">' + (p.regi ? "2019 · eredeti" : "2020 · újrafeltöltve") + '</span>' +
            '<div class="nev">' + p.file + '</div>' +
            '<div class="meret">' + px + ' · ' + kb(p.bytes) + '</div>' +
            '<div class="sor">WP id ' + (p.wpId ?? "?") + ' · ' + (p.eredeti || "?") + '</div>' +
            '<div class="marka">' + marka + '</div>' +
            '<div class="katvaltas"><select data-kat="' + k + '"' + (cls === "drop" ? " disabled" : "") + '>' + opt + '</select></div>' +
          '</div></div>';
      }).join("") +
      '</div>' +
      '<div class="gomb">' +
        '<button data-nagy="' + ci + '">A legnagyobbat tartom</button>' +
        '<button data-orig="' + ci + '">A 2019-est tartom</button>' +
        '<button data-tiszt="' + ci + '">Jelölés törlése</button>' +
      '</div>' +
    '</div>';
  }).join("");

  t.querySelectorAll(".peldany").forEach(el => {
    el.addEventListener("click", (ev) => {
      if (ev.target.tagName === "SELECT") return;
      const ci = +el.dataset.ci, pi = +el.dataset.pi;
      const p = CSOPORT[ci].peldanyok[pi];
      const k = kulcs(p);
      if (dontes[k] === true) dontes[k] = false;
      else if (dontes[k] === false) delete dontes[k];
      else {
        CSOPORT[ci].peldanyok.forEach(x => { if (x !== p) dontes[kulcs(x)] = false; });
        dontes[k] = true;
      }
      render(); aktual();
    });
  });
  t.querySelectorAll("[data-nagy]").forEach(b => b.addEventListener("click", () => {
    const ci = +b.dataset.nagy;
    // az eredeti (a WordPress méret-utótagja nélkül) előrébb, mint a bélyegkép
    const p = [...CSOPORT[ci].peldanyok].sort((a, b2) => {
      const aB = /-\d+x\d+\.webp$/.test(a.file), bB = /-\d+x\d+\.webp$/.test(b2.file);
      if (aB !== bB) return aB ? 1 : -1;
      const d = ((b2.px ? b2.px.w * b2.px.h : 0) - (a.px ? a.px.w * a.px.h : 0));
      if (d) return d;
      return (a.wpId ?? 1e9) - (b2.wpId ?? 1e9);
    })[0];
    CSOPORT[ci].peldanyok.forEach(x => dontes[kulcs(x)] = x === p ? true : false);
    render(); aktual();
  }));
  t.querySelectorAll("[data-orig]").forEach(b => b.addEventListener("click", () => {
    const ci = +b.dataset.orig;
    const p = CSOPORT[ci].peldanyok.find(x => x.regi) || CSOPORT[ci].peldanyok[0];
    CSOPORT[ci].peldanyok.forEach(x => dontes[kulcs(x)] = x === p ? true : false);
    render(); aktual();
  }));
  t.querySelectorAll("[data-tiszt]").forEach(b => b.addEventListener("click", () => {
    const ci = +b.dataset.tiszt;
    CSOPORT[ci].peldanyok.forEach(x => delete dontes[kulcs(x)]);
    render(); aktual();
  }));
  t.querySelectorAll("select[data-kat]").forEach(sel => sel.addEventListener("change", () => {
    const k = sel.dataset.kat;
    const eredeti = k.split("|")[0];
    if (sel.value === eredeti) delete kategoriak[k];
    else kategoriak[k] = sel.value;
    aktual();
  }));
}

document.getElementById("ment").addEventListener("click", async () => {
  const g = document.getElementById("ment");
  g.disabled = true; g.textContent = "Alkalmazás…";
  try {
    const r = await fetch("/api/dontes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dontes, kategoriak }),
    });
    const j = await r.json();
    document.getElementById("allapot").textContent = j.ok
      ? "✓ Alkalmazva: " + (j.alkalmazva || "a választás mentve")
      : "✗ Hiba: " + (j.hiba || "ismeretlen");
  } catch (e) {
    document.getElementById("allapot").textContent = "✗ Hiba: " + e.message;
  }
  g.disabled = false; g.textContent = "Mentés és alkalmazás";
});
document.getElementById("vissza").addEventListener("click", () => { dontes = {}; kategoriak = {}; render(); aktual(); });

render(); aktual();
</script>
</body>
</html>`;

// --- szerver ---
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/dontes') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      await mkdir(path.dirname(DON), { recursive: true });
      const d = JSON.parse(body);
      await writeFile(DON, JSON.stringify(d, null, 2));
      const out = spawnSync(process.execPath, [path.join(ROOT, 'dedup.mjs')], {
        cwd: ROOT, encoding: 'utf8',
      });
      res.writeHead(out.status === 0 ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: out.status === 0,
        fajl: DON,
        alkalmazva: out.stdout?.trim().split('\n').slice(-3).join(' | ') || '',
        hiba: out.status === 0 ? null : (out.stderr || out.stdout),
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, hiba: e.message }));
    }
    return;
  }
  if (req.url.startsWith('/img/opt/')) {
    const f = path.join(OPT, path.basename(req.url));
    if (existsSync(f)) {
      res.writeHead(200, { 'Content-Type': 'image/webp' });
      res.end(await readFile(f));
      return;
    }
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  console.log('Galéria-duplikátum döntő: ' + url);
  console.log('  ' + csoportokAdat.length + ' csoport · ' + csoportokAdat.reduce((n, c) => n + c.peldanyok.length, 0) + ' fájl');
  console.log('  a választás ide kerül: ' + path.relative(ROOT, DON));
  spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
});
