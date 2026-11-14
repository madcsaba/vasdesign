/**
 * Közös galéria-kulcsok – a duplikátum felismeréshez.
 *
 * A WordPress ugyanazt a fotót többször feltöltötte, méretváltozatokkal
 * (`-727x1024`, `-213x300` bélyegképek, `-scaled` nagyítványok). Ezek
 *.byte-ra különböznek, de vizuálisan ugyanaz a kép – a duplikátum-felismerés
 * ezért a fájlnévből levezetett „fotókulcsot" használja.
 */

/**
 * A fotó kulcsa: a WordPress által generált méret- és scaled-utótagok nélkül.
 *   vas-…-img-8432-1.webp             → vas-…-img-8432-1
 *   vas-…-img-8432-1-727x1024.webp   → vas-…-img-8432-1
 */
export function fotokulcs(file) {
  return file
    .replace(/\.webp$/, '')
    .replace(/-\d+x\d+$/, '')   // WordPress bélyegkép: -727x1024
    .replace(/-scaled$/, '')     // WordPress nagyítvány: -scaled
    .replace(/-(1|2)$/, '')     // WordPress „már van ilyen nevű": -1, -2
    .toLowerCase();
}

/** A WebP fejlécéből olvassa ki a pixelméretet (méretezés nélkül). */
export function webpDim(buf) {
  if (!buf || buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (fourcc === 'VP8 ') {
    const i = buf.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
    if (i < 0) return null;
    return { w: buf.readUInt16LE(i + 3) & 0x3fff, h: buf.readUInt16LE(i + 5) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    const i = buf.indexOf(Buffer.from([0x2f]));
    if (i < 0) return null;
    const b = buf.readUInt32LE(i + 1);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  return null;
}

/** A képpontok száma – a "legnagyobb kép" sorrendjéhez. */
export function pixelCount(dim) {
  return dim ? dim.w * dim.h : 0;
}
