// Genererar mockade postermotiv som fristående SVG-filer i assets/posters/.
// All text konverteras till vektorbanor så att motiven ser likadana ut överallt.
// Kör: npm run posters

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/posters');
const CACHE = path.join(ROOT, 'scripts/.font-cache');

const W = 500;
const H = 700;

/* ------------------------------------------------------------------ fonts */

const FONT_SOURCES = {
  xblack: 'Archivo:wdth,wght@125,800',
  cond: 'Archivo:wdth,wght@62.5,800',
  caption: 'Archivo:wdth,wght@100,600',
  serif: 'DM+Serif+Display',
  serifi: 'DM+Serif+Display:ital@1',
  mono: 'IBM+Plex+Mono:wght@500',
};
const F = {};

async function loadFonts() {
  await fs.mkdir(CACHE, { recursive: true });
  for (const [key, family] of Object.entries(FONT_SOURCES)) {
    const file = path.join(CACHE, `${key}.ttf`);
    let buf;
    try {
      buf = await fs.readFile(file);
    } catch {
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}`)).text();
      const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
      if (!url) throw new Error(`Hittade ingen TTF för ${family}`);
      buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      await fs.writeFile(file, buf);
    }
    F[key] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
}

function layout(str, font, size, ls = 0) {
  const f = F[font];
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(str);
  const pos = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    pos.push(x);
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) x += f.getKerningValue(g, glyphs[i + 1]) * scale + ls * size;
  });
  return { glyphs, pos, width: x };
}

/** Text som vektorbana. fit = önskad bredd (px), ls = spärrning i em. */
function T(str, { font = 'caption', size = 12, x = 0, y = 0, anchor = 'start', fill = '#000', ls = 0, fit, opacity, transform }) {
  if (fit) size = (fit / layout(str, font, 100, ls).width) * 100;
  const L = layout(str, font, size, ls);
  const x0 = anchor === 'middle' ? x - L.width / 2 : anchor === 'end' ? x - L.width : x;
  let d = '';
  L.glyphs.forEach((g, i) => { d += g.getPath(x0 + L.pos[i], y, size).toPathData(1); });
  return `<path d="${d}" fill="${fill}"${opacity ? ` opacity="${opacity}"` : ''}${transform ? ` transform="${transform}"` : ''}/>`;
}
const capH = (font, size) => (F[font].tables.os2.sCapHeight / F[font].unitsPerEm) * size;
const fitSize = (str, font, width, ls = 0) => (width / layout(str, font, 100, ls).width) * 100;

/* ---------------------------------------------------------------- helpers */

function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + next() * (hi - lo);
  next.int = (lo, hi) => Math.floor(next.range(lo, hi + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}
const n = (v) => Math.round(v * 10) / 10;
const pts = (arr) => arr.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
const rad = (d) => (d * Math.PI) / 180;

function doc(body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;
}
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"${extra}/>`;

/** Konstnärsmarginal: motivet i en ruta med papperskant och bildtext under. */
const ART = { x: 36, y: 36, w: 428, h: 576 };
const artClip = (id = 'art') => `<clipPath id="${id}"><rect x="${ART.x}" y="${ART.y}" width="${ART.w}" height="${ART.h}"/></clipPath>`;

function footer(left, right, color, { y = 660, x0 = ART.x, x1 = ART.x + ART.w } = {}) {
  return (
    T(left.toUpperCase(), { font: 'caption', size: 10, x: x0, y, fill: color, ls: 0.18 }) +
    T(right.toUpperCase(), { font: 'caption', size: 10, x: x1, y, fill: color, ls: 0.18, anchor: 'end' })
  );
}

function pie(cx, cy, r, a0, a1) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = [cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0))];
  const p1 = [cx + r * Math.cos(rad(a1)), cy + r * Math.sin(rad(a1))];
  return `M${n(cx)} ${n(cy)}L${n(p0[0])} ${n(p0[1])}A${n(r)} ${n(r)} 0 ${large} 1 ${n(p1[0])} ${n(p1[1])}Z`;
}

/** Sluten mjuk kurva genom punkter (Catmull-Rom → Bézier). */
function smoothClosed(p) {
  const N = p.length;
  let d = `M${n(p[0][0])} ${n(p[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = p[(i - 1 + N) % N], p1 = p[i], p2 = p[(i + 1) % N], p3 = p[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d + 'Z';
}

/** Bergskam via mittpunktsförskjutning. */
function ridge(R, y0, y1, amp, rough = 0.55, levels = 7) {
  let p = [[0, y0], [W, y1]];
  let a = amp;
  for (let l = 0; l < levels; l++) {
    const next = [];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      next.push(p[i], [(ax + bx) / 2, (ay + by) / 2 + R.range(-a, a)]);
    }
    next.push(p[p.length - 1]);
    p = next;
    a *= rough;
  }
  return p;
}
const fillBelow = (line, bottom = H) => `M0 ${bottom}L${line.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}L${W} ${bottom}Z`;

function wave(yBase, parts, step = 8, x0 = 0, x1 = W) {
  const out = [];
  for (let x = x0; x <= x1 + 0.01; x += step) {
    let y = yBase;
    for (const [amp, freq, phase] of parts) y += amp * Math.sin(x * freq + phase);
    out.push([x, y]);
  }
  return out;
}

/* ---------------------------------------------------------------- posters */

const posters = {};

posters['solnedgang-no-3'] = () => {
  const bg = '#F4E6D6';
  const sunMask = [...Array(8)].map((_, i) => rect(0, 356 + i * 19, W, 1.6 + i * 1.9, '#000')).join('');
  const defs = `${artClip()}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E4CF"/><stop offset="1" stop-color="#F3BE9C"/></linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD66E"/><stop offset=".55" stop-color="#F58A4B"/><stop offset="1" stop-color="#DA4A68"/></linearGradient>
    <mask id="cut"><rect width="${W}" height="${H}" fill="#fff"/>${sunMask}</mask>`;
  const hills = [
    [470, [[14, 0.011, 1], [6, 0.03, 2]], '#EE9368'],
    [505, [[18, 0.009, 3], [5, 0.026, 1]], '#C4506A'],
    [548, [[16, 0.012, 5], [7, 0.02, 0]], '#4B2F52'],
  ].map(([y, parts, c]) => `<path d="${fillBelow(wave(y, parts))}" fill="${c}"/>`).join('');
  return doc(
    rect(0, 0, W, H, bg) +
      `<g clip-path="url(#art)">${rect(0, 0, W, H, 'url(#sky)')}${circle(250, 330, 150, 'url(#sun)', ' mask="url(#cut)"')}${hills}</g>` +
      footer('Solnedgång Nº 3', 'Ines Morell', '#4B2F52'),
    defs,
  );
};

posters['bauhaus-studie-07'] = () => {
  const R = rng(707);
  const bg = '#EEE8DC';
  const pal = ['#1F2A44', '#D6612F', '#E8B53F', '#2E5A46', '#EEE8DC', '#C9C0B0'];
  const cols = 3, rows = 4, s = ART.w / cols;
  const cellH = ART.h / rows;
  let body = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ART.x + c * s, y = ART.y + r * cellH;
      const cb = R.pick(pal);
      let fc = R.pick(pal);
      while (fc === cb) fc = R.pick(pal);
      body += rect(x, y, s, cellH, cb);
      const t = R.int(0, 6);
      const cx = x + s / 2, cy = y + cellH / 2;
      const m = Math.min(s, cellH);
      if (t === 0) body += `<path d="${pie(x, y, m, 0, 90)}" fill="${fc}"/>`;
      else if (t === 1) body += `<path d="${pie(x + s, y + cellH, m, 180, 270)}" fill="${fc}"/>`;
      else if (t === 2) body += circle(cx, cy, m * 0.38, fc);
      else if (t === 3) body += `<path d="${pie(cx, y + cellH, s / 2, 180, 360)}" fill="${fc}"/>`;
      else if (t === 4) body += `<polygon points="${pts([[x, y + cellH], [x + s, y + cellH], [x + s, y]])}" fill="${fc}"/>`;
      else if (t === 5) body += circle(cx, cy, m * 0.42, fc) + circle(cx, cy, m * 0.22, cb);
      else body += rect(x, cy - cellH * 0.12, s, cellH * 0.24, fc);
    }
  }
  return doc(rect(0, 0, W, H, bg) + body + footer('Bauhaus Studie 07', 'Aron Lindqvist', '#1F2A44'));
};

posters['fjallvarld'] = () => {
  const R = rng(1203);
  const defs = `${artClip()}<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCE5E6"/><stop offset="1" stop-color="#F2E6D8"/></linearGradient>`;
  const cols = ['#C4CFD3', '#A5B4BC', '#80939F', '#5B6E7D', '#3B4C5A', '#1F2C37'];
  let body = rect(0, 0, W, H, 'url(#sky)') + circle(342, 176, 40, '#F6EEE2');
  cols.forEach((c, i) => {
    const base = 300 + i * 52;
    const line = ridge(R, base + R.range(-30, 30), base + R.range(-30, 30), 90 - i * 8, 0.52);
    body += `<path d="${fillBelow(line)}" fill="${c}"/>`;
    if (i < cols.length - 1) body += `<path d="${fillBelow(line.map(([x, y]) => [x, y + 26]))}" fill="#F2E6D8" opacity="${0.18 - i * 0.02}"/>`;
  });
  return doc(rect(0, 0, W, H, '#F1EEE8') + `<g clip-path="url(#art)">${body}</g>` + footer('Fjällvärld', '68°21′N · Theo Nakamura-Berg', '#1F2C37'), defs);
};

posters['form-1968'] = () => {
  const bg = '#ECEAE4';
  const ink = '#141414';
  let body = rect(0, 0, W, H, bg);
  body += circle(310, 236, 158, '#E0452B');
  body += T('68', { font: 'xblack', fit: 436, x: 30, y: 520, fill: ink, ls: -0.06 });
  body += rect(36, 548, 428, 2, ink);
  body += T('FORM', { font: 'xblack', size: 38, x: 36, y: 600, fill: ink, ls: -0.02 });
  body += T('& FUNKTION', { font: 'xblack', size: 38, x: 36, y: 640, fill: ink, ls: -0.02 });
  const info = ['Utställning om vardagens föremål', 'Konsthallen, plan 2', '12.04 — 30.06 1968'];
  info.forEach((t, i) => { body += T(t, { font: 'caption', size: 10.5, x: 464, y: 590 + i * 16, fill: ink, anchor: 'end', ls: 0.02 }); });
  body += T('STOL · LAMPA · KANNA · STOL · LAMPA · KANNA', { font: 'caption', size: 9, x: 0, y: 0, fill: ink, ls: 0.3, transform: 'translate(470 40) rotate(90)' });
  return doc(body);
};

posters['utklipp-i-juni'] = () => {
  const R = rng(611);
  const bg = '#F3EBDF';
  const pal = ['#1D4FA3', '#E4683A', '#F0B32E', '#2C6B4A', '#F0A6B6', '#171717'];
  let body = rect(0, 0, W, H, bg);
  const spots = [[150, 170], [340, 150], [250, 330], [120, 430], [370, 420], [230, 540], [400, 590]];
  spots.forEach(([cx, cy], i) => {
    const c = pal[i % pal.length];
    const star = i % 2 === 1;
    const N = star ? 60 : 9;
    const Rr = star ? R.range(62, 84) : R.range(58, 88);
    const k = R.int(4, 7), ph = R.range(0, 6);
    const p = [...Array(N)].map((_, j) => {
      const a = (j / N) * Math.PI * 2;
      const rr = star ? Rr * (0.62 + 0.38 * Math.abs(Math.sin((k * a) / 2 + ph))) : Rr * R.range(0.72, 1.15);
      return [cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 1.08];
    });
    body += `<path d="${smoothClosed(p)}" fill="${c}" transform="rotate(${n(R.range(-20, 20))} ${cx} ${cy})"/>`;
  });
  return doc(rect(0, 0, W, H, bg) + `<g clip-path="url(#art)">${body}</g>` + footer('Utklipp i juni', 'Maja Ekdahl', '#171717'), artClip());
};

posters['valv'] = () => {
  const bg = '#F1E6D9';
  const cols = ['#C4633B', '#E9B18B', '#F6E9DA', '#8E9C7C', '#34423A', '#E3C49A'];
  let body = rect(0, 0, W, H, bg);
  body += circle(118, 138, 44, '#E3A36F');
  const base = 596, h = 170, m = 28;
  for (let i = 0; i < 6; i++) {
    const w = 380 - 2 * m * i;
    const x0 = 250 - w / 2, x1 = 250 + w / 2;
    body += `<path d="M${n(x0)} ${base}L${n(x0)} ${base - h}A${n(w / 2)} ${n(w / 2)} 0 0 1 ${n(x1)} ${base - h}L${n(x1)} ${base}Z" fill="${cols[i]}"/>`;
  }
  body += rect(36, base, 428, 2, '#34423A');
  return doc(body + footer('Valv', 'Elin Fors', '#34423A'));
};

posters['gronska'] = () => {
  const R = rng(4242);
  const bg = '#E6E3D6';
  const greens = ['#1F3A30', '#2D4A3E', '#3F6B55', '#5E8469', '#88A884'];
  let leaves = '';
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = -62 + (124 * i) / (N - 1) + R.range(-6, 6);
    const s = R.range(90, 190), L = R.range(170, 250), w = R.range(56, 84);
    const c = R.pick(greens);
    const y0 = -s, y1 = -(s + L);
    let veins = '';
    for (let k = 1; k <= 6; k++) {
      const t = k / 7, y = y0 - L * t, vw = w * 0.62 * Math.sin(Math.PI * Math.min(1, t * 1.15));
      veins += `M0 ${n(y)}L${n(vw)} ${n(y - L * 0.09)}M0 ${n(y)}L${n(-vw)} ${n(y - L * 0.09)}`;
    }
    leaves += `<g transform="translate(250 ${H - 60}) rotate(${n(a)})">
      <path d="M0 0L0 ${n(y0)}" stroke="${c}" stroke-width="3" fill="none"/>
      <path d="M0 ${n(y0)}C${n(w)} ${n(y0 - L * 0.12)} ${n(w * 0.8)} ${n(y0 - L * 0.78)} 0 ${n(y1)}C${n(-w * 0.8)} ${n(y0 - L * 0.78)} ${n(-w)} ${n(y0 - L * 0.12)} 0 ${n(y0)}Z" fill="${c}"/>
      <path d="M0 ${n(y0)}L0 ${n(y1 + 12)}${veins}" stroke="${bg}" stroke-opacity=".45" stroke-width="1.4" fill="none"/></g>`;
  }
  return doc(rect(0, 0, W, H, bg) + `<g clip-path="url(#art)">${rect(0, 0, W, H, '#DAD6C6')}${leaves}</g>` + footer('Grönska', 'Studio Kvist', '#1F3A30'), artClip());
};

posters['kebnekaise-topografi'] = () => {
  const R = rng(2097);
  const bg = '#EEF0EA', ink = '#26352F';
  const h = [...Array(3)].map((_, i) => [R.range(0.06, 0.12) / (i + 1) ** 0.3, i + 2, R.range(0, 6)]);
  let lines = '';
  for (let k = 1; k <= 34; k++) {
    const base = k * 15.5;
    const cx = 236 + k * 1.1, cy = 300 + k * 1.3;
    const p = [];
    for (let j = 0; j < 90; j++) {
      const a = (j / 90) * Math.PI * 2;
      let f = 1;
      for (const [amp, freq, ph] of h) f += amp * Math.sin(freq * a + ph + k * 0.05);
      const rr = base * f + 2.2 * Math.sin(a * 6 + k * 0.7);
      p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 1.12]);
    }
    const major = k % 5 === 0;
    lines += `<path d="${smoothClosed(p)}" fill="none" stroke="${ink}" stroke-width="${major ? 1.5 : 0.7}" opacity="${major ? 1 : 0.75}"/>`;
  }
  const lake = [...Array(10)].map((_, j) => {
    const a = (j / 10) * Math.PI * 2;
    const rr = R.range(20, 30);
    return [110 + rr * 1.5 * Math.cos(a), 520 + rr * Math.sin(a)];
  });
  let grid = '';
  for (let x = ART.x + 107; x < ART.x + ART.w; x += 107) grid += `M${x} ${ART.y}L${x} ${ART.y + ART.h}`;
  for (let y = ART.y + 115.2; y < ART.y + ART.h; y += 115.2) grid += `M${ART.x} ${n(y)}L${ART.x + ART.w} ${n(y)}`;
  const body =
    rect(0, 0, W, H, bg) +
    `<g clip-path="url(#art)">${rect(0, 0, W, H, '#F4F4EF')}<path d="${smoothClosed(lake)}" fill="#AFC6CC"/>${lines}<path d="${grid}" stroke="${ink}" stroke-width=".5" stroke-dasharray="2 4" fill="none"/></g>` +
    `<polygon points="${pts([[237, 294], [244, 306], [230, 306]])}" fill="${ink}"/>` +
    T('2 097', { font: 'mono', size: 10, x: 249, y: 305, fill: ink }) +
    `<rect x="${ART.x}" y="${ART.y}" width="${ART.w}" height="${ART.h}" fill="none" stroke="${ink}" stroke-width="1"/>` +
    footer('Kebnekaise', '67°54′N 18°31′E', ink);
  return doc(body, artClip());
};

posters['pulsar'] = () => {
  const R = rng(1919);
  const bg = '#111111';
  let body = rect(0, 0, W, H, bg);
  const N = 62;
  for (let i = 0; i < N; i++) {
    const y0 = 150 + i * 6.4;
    const ph = [...Array(5)].map(() => [R.range(0.04, 0.16), R.range(0, 6), R.range(0.4, 1)]);
    const p = [];
    for (let x = 110; x <= 390; x += 3.5) {
      const env = Math.exp(-(((x - 250) / 58) ** 2));
      let v = 0;
      for (const [f, o, a] of ph) v += a * (0.5 + 0.5 * Math.sin(x * f + o));
      p.push([x, y0 - env * v * 22 - R.range(0, 1.6)]);
    }
    body += `<path d="M${pts(p).replaceAll(' ', 'L')}L390 ${n(y0 + 20)}L110 ${n(y0 + 20)}Z" fill="${bg}"/><path d="M${pts(p).replaceAll(' ', 'L')}" fill="none" stroke="#F2F0EA" stroke-width="1.15" stroke-linejoin="round"/>`;
  }
  body += T('PULSAR', { font: 'caption', size: 12, x: 250, y: 620, fill: '#F2F0EA', anchor: 'middle', ls: 0.5 });
  body += T('PSR B1919+21 · 1,337 S', { font: 'mono', size: 8.5, x: 250, y: 640, fill: '#8C8A84', anchor: 'middle', ls: 0.1 });
  return doc(body);
};

posters['manfaser'] = () => {
  const bg = '#18202F', lit = '#EDE5D3', dim = '#27324A', ink = '#C9BE9F';
  const phases = [
    ['Nymåne', 0], ['Växande skära', 0.25], ['Första kvarter', 0.5], ['Växande halvmåne', 0.75],
    ['Fullmåne', 1], ['Avtagande', 0.75], ['Sista kvarter', 0.5], ['Avtagande skära', 0.25],
  ];
  let body = rect(0, 0, W, H, bg);
  const r = 25, cx = 196;
  phases.forEach(([label, f], i) => {
    const cy = 92 + i * 64;
    const waning = i > 4;
    body += circle(cx, cy, r, dim);
    if (f > 0 && f < 1) {
      const rx = r * Math.abs(1 - 2 * f);
      const sweep = f < 0.5 ? 0 : 1;
      body += `<path d="M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${n(rx)} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z" fill="${lit}"${waning ? ` transform="translate(${2 * cx} 0) scale(-1 1)"` : ''}/>`;
    } else if (f === 1) body += circle(cx, cy, r, lit);
    body += T(label.toUpperCase(), { font: 'caption', size: 9.5, x: 248, y: cy + 3.5, fill: ink, ls: 0.2 });
    body += T(`${String(Math.round(i * 3.69 * 10) / 10).replace('.', ',')} D`, { font: 'mono', size: 8.5, x: 138, y: cy + 3, fill: '#6F7890', anchor: 'end' });
  });
  body += rect(36, 612, 428, 1, '#3A4560');
  return doc(body + footer('Månfaser', 'En cykel · 29,5 dygn', ink));
};

posters['aura-04'] = () => {
  const defs = `<filter id="b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="58"/></filter>`;
  let body = rect(0, 0, W, H, '#EFE9EF');
  body += `<g filter="url(#b)">${circle(170, 220, 150, '#F6AE9A')}${circle(340, 330, 160, '#AFC0F4')}${circle(210, 500, 150, '#F5D68A')}${circle(360, 590, 110, '#BFE3D2')}</g>`;
  body += T('aura', { font: 'serifi', size: 64, x: 250, y: 380, fill: '#FFFFFF', anchor: 'middle' });
  body += footer('Aura 04', 'Noor Haddad', '#5A5566');
  return doc(body, defs);
};

posters['betongdrom'] = () => {
  const R = rng(1971);
  let body = rect(0, 0, W, H, '#EDE6DA');
  body += `<g clip-path="url(#art)">${rect(0, 0, W, H, '#E6D3B8')}`;
  const bx = 78, bw = 344, by = 96, bh = 520;
  body += rect(bx, by, bw, bh, '#B8B3A8');
  for (let x = bx; x < bx + bw; x += 43) body += rect(x, by, 1, bh, '#A39E93');
  const cols = 6, rows = 11, gw = bw / cols, gh = (bh - 30) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bx + c * gw + 9, y = by + 16 + r * gh + 8;
      const roll = R();
      const fill = roll < 0.1 ? '#F2C14E' : roll < 0.2 ? '#5877A8' : roll < 0.26 ? '#C9573A' : '#343840';
      body += rect(x, y, gw - 18, gh - 20, fill);
      if (r % 2 === 1) body += rect(x - 6, y + gh - 18, gw - 6, 5, '#D2CEC4');
    }
  }
  body += rect(bx - 10, by - 10, bw + 20, 10, '#9F9A8F');
  body += rect(0, by + bh, W, 40, '#6E685D');
  body += '</g>';
  return doc(body + footer('Betongdröm', 'Jonas Vik', '#343840'), artClip());
};

posters['funkis-1932'] = () => {
  let body = rect(0, 0, W, H, '#EFEBE3');
  body += `<g clip-path="url(#art)">${rect(0, 0, W, H, '#B9D0DE')}`;
  body += rect(0, 470, W, 200, '#7E9C6C');
  body += circle(392, 132, 34, '#F4E3B5');
  // träd
  body += rect(410, 360, 6, 112, '#5E4B3A') + circle(413, 340, 42, '#4F7449') + circle(96, 392, 30, '#5F845A') + rect(94, 410, 5, 62, '#5E4B3A');
  // huset
  body += rect(118, 330, 270, 142, '#F6F4EE');
  body += rect(170, 242, 218, 92, '#FBFAF6');
  body += rect(160, 236, 238, 8, '#DAD6CC') + rect(108, 324, 290, 8, '#DAD6CC');
  body += rect(184, 268, 150, 30, '#2F3A45') + rect(138, 364, 120, 30, '#2F3A45');
  body += circle(354, 283, 15, '#2F3A45') + circle(354, 283, 11, '#6E8BA3');
  body += rect(290, 384, 34, 88, '#C8553D');
  let rail = '';
  for (let x = 120; x <= 166; x += 8) rail += `M${x} 304L${x} 324`;
  body += `<path d="M118 304L168 304${rail}" stroke="#2F3A45" stroke-width="1.6" fill="none"/>`;
  body += rect(270, 472, 70, 10, '#D8D1C2');
  body += '</g>';
  return doc(body + footer('Funkis 1932', 'Jonas Vik', '#2F3A45'), artClip());
};

posters['op-art-21'] = () => {
  const cx = 250, cy = 320, sig = 118, amp = 64;
  const N = 22, sw = ART.w / N;
  const disp = (x, y) => {
    const dx = x - cx, dy = y - cy;
    return x + (amp * dx) / sig * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
  };
  let body = rect(0, 0, W, H, '#F2F0EA') + `<g clip-path="url(#art)">${rect(0, 0, W, H, '#F2F0EA')}`;
  for (let i = 0; i < N; i += 2) {
    const xl = ART.x + i * sw, xr = xl + sw;
    const left = [], right = [];
    for (let y = ART.y - 4; y <= ART.y + ART.h + 4; y += 8) { left.push([disp(xl, y), y]); right.push([disp(xr, y), y]); }
    body += `<polygon points="${pts([...left, ...right.reverse()])}" fill="#151515"/>`;
  }
  body += '</g>';
  return doc(body + footer('Op Art 21', 'Aron Lindqvist', '#151515'), artClip());
};

posters['ljus-och-skugga'] = () => {
  const ink = '#141414';
  let body = rect(0, 0, W, H, '#EFEDE7');
  body += `<g clip-path="url(#art)">${circle(360, 470, 200, '#F2C230')}<path d="${pie(360, 470, 200, 90, 270)}" fill="${ink}" opacity=".92"/></g>`;
  const s = fitSize('SKUGGA', 'xblack', 300, -0.02);
  ['LJUS', 'OCH', 'SKUGGA'].forEach((w, i) => { body += T(w, { font: 'xblack', size: s, x: 36, y: 36 + capH('xblack', s) * (i + 1) + i * 12, fill: ink, ls: -0.02 }); });
  body += T('En utställning om fotografi', { font: 'caption', size: 11, x: 36, y: 228, fill: ink });
  body += T('14.03 — 02.06', { font: 'mono', size: 11, x: 36, y: 246, fill: ink });
  return doc(body + footer('Ljus och skugga', 'Klara Sund', ink), artClip());
};

posters['rutor-i-rorelse'] = () => {
  const a = '#EFC7CF', b = '#7A2E3A';
  const warp = (x, y) => [x + 16 * Math.sin(y / 58 + 1.2), y + 16 * Math.sin(x / 66 + 0.3)];
  const cols = 8, s = ART.w / cols, rows = Math.ceil(ART.h / s) + 1;
  let body = rect(0, 0, W, H, '#F4ECE6') + `<g clip-path="url(#art)">${rect(0, 0, W, H, a)}`;
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c <= cols; c++) {
      if ((r + c) % 2 !== 0) continue;
      const x = ART.x + c * s, y = ART.y + r * s;
      const edge = [];
      const k = 5;
      for (let i = 0; i < k; i++) edge.push(warp(x + (s * i) / k, y));
      for (let i = 0; i < k; i++) edge.push(warp(x + s, y + (s * i) / k));
      for (let i = 0; i < k; i++) edge.push(warp(x + s - (s * i) / k, y + s));
      for (let i = 0; i < k; i++) edge.push(warp(x, y + s - (s * i) / k));
      body += `<polygon points="${pts(edge)}" fill="${b}"/>`;
    }
  }
  body += '</g>';
  return doc(body + footer('Rutor i rörelse', 'Studio Kvist', b), artClip());
};

posters['blomstermarknad'] = () => {
  const R = rng(820);
  const bg = '#F3D8CD', green = '#2F4D3B';
  let body = rect(0, 0, W, H, bg);
  const s1 = fitSize('BLOMSTER', 'cond', 428);
  const s2 = fitSize('MARKNAD', 'cond', 428);
  body += T('BLOMSTER', { font: 'cond', size: s1, x: 36, y: 36 + capH('cond', s1), fill: green });
  body += T('MARKNAD', { font: 'cond', size: s2, x: 36, y: 36 + capH('cond', s1) + 10 + capH('cond', s2), fill: green });
  const root = [250, 640];
  const heads = [[150, 330, 'daisy'], [250, 280, 'round'], [345, 330, 'tulip'], [200, 420, 'tulip'], [315, 430, 'daisy'], [118, 450, 'round'], [390, 440, 'round']];
  let stems = '', flowers = '', leaves = '';
  heads.forEach(([x, y], i) => {
    stems += `<path d="M${root[0]} ${root[1]}Q${n((x + root[0]) / 2 + R.range(-20, 20))} ${n((y + root[1]) / 2)} ${x} ${y}" stroke="${green}" stroke-width="3.2" fill="none"/>`;
    if (i % 2 === 0) {
      const mx = (x + root[0]) / 2, my = (y + root[1]) / 2 + 30, ang = n(Math.atan2(y - root[1], x - root[0]) * 57.3 + (i % 4 ? 50 : -50));
      leaves += `<ellipse cx="${n(mx)}" cy="${n(my)}" rx="30" ry="10" fill="#4E7A5A" transform="rotate(${ang} ${n(mx)} ${n(my)})"/>`;
    }
  });
  heads.forEach(([x, y, type]) => {
    if (type === 'daisy') {
      for (let k = 0; k < 12; k++) flowers += `<ellipse cx="${x}" cy="${y - 20}" rx="7.5" ry="20" fill="#FFFBF3" transform="rotate(${k * 30} ${x} ${y})"/>`;
      flowers += circle(x, y, 11, '#F2B530');
    } else if (type === 'tulip') {
      flowers += `<path d="M${x - 24} ${y - 34}C${x - 26} ${y + 2} ${x - 10} ${y + 12} ${x} ${y + 12}C${x + 10} ${y + 12} ${x + 26} ${y + 2} ${x + 24} ${y - 34}L${x + 12} ${y - 18}L${x} ${y - 38}L${x - 12} ${y - 18}Z" fill="#D9473B"/>`;
    } else {
      flowers += circle(x, y, 30, '#EE8A3C') + circle(x, y, 20, '#F4A55E') + circle(x, y, 9, '#C9612A');
    }
  });
  body += leaves + stems + flowers;
  body += `<path d="M216 598L284 598L276 650L224 650Z" fill="#C8683F"/>`;
  return doc(body + footer('Stockholm · Lördagar 08–14', 'Studio Kvist', green));
};

posters['citrus'] = () => {
  const R = rng(333);
  const kinds = [['#F08A24', '#F9B25B'], ['#EFC42B', '#F7DC72'], ['#E66F5C', '#F4A08C'], ['#86B04A', '#B8D57D']];
  let body = rect(0, 0, W, H, '#F6EBD8');
  const cols = 3, rows = 4, gx = ART.w / cols, gy = ART.h / rows, r = 58;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cx = ART.x + gx * (j + 0.5), cy = ART.y + gy * (i + 0.5);
      const [rind, flesh] = R.pick(kinds);
      const rot = R.range(0, 360);
      let seg = '';
      for (let k = 0; k < 10; k++) seg += `<path d="${pie(cx, cy, r * 0.78, k * 36 + 3, k * 36 + 33)}" fill="${flesh}"/>`;
      body += `<g transform="rotate(${n(rot)} ${n(cx)} ${n(cy)})">${circle(cx, cy, r, rind)}${circle(cx, cy, r * 0.86, '#FFF5E1')}${seg}${circle(cx, cy, r * 0.12, '#FFF5E1')}</g>`;
    }
  }
  return doc(body + footer('Citrus', 'Elin Fors', '#8A4A1C'));
};

posters['skargard'] = () => {
  const R = rng(59);
  const hz = 402;
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FB9CD"/><stop offset=".62" stop-color="#E9D3C6"/><stop offset="1" stop-color="#F7D2B2"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FA6B4"/><stop offset="1" stop-color="#2D475B"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF1DC" stop-opacity=".9"/><stop offset="1" stop-color="#FFF1DC" stop-opacity="0"/></radialGradient>`;
  let body = rect(0, 0, W, hz, 'url(#sky)') + rect(0, hz, W, H - hz, 'url(#sea)');
  body += circle(300, hz, 110, 'url(#glow)') + `<path d="${pie(300, hz, 24, 180, 360)}" fill="#FFF3E2"/>`;
  const islands = [[40, 170, 14, '#6E7F86'], [360, 470, 10, '#7E8E94'], [150, 250, 22, '#3E4E54'], [-10, 90, 30, '#33434A']];
  islands.forEach(([x0, x1, hgt, c]) => {
    const p = [];
    for (let x = x0; x <= x1; x += 4) {
      const t = (x - x0) / (x1 - x0);
      p.push([x, hz - Math.sin(Math.PI * t) ** 0.7 * hgt - R.range(0, hgt * 0.25)]);
    }
    body += `<path d="M${x0} ${hz}L${p.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}L${x1} ${hz}Z" fill="${c}"/>`;
  });
  for (let i = 0; i < 16; i++) {
    const y = hz + 8 + i * i * 1.3, w = 70 - i * 3.4 + R.range(-6, 6);
    body += rect(300 - w / 2 + R.range(-8, 8), y, w, 1.6 + i * 0.12, '#FBE3C4', ` opacity="${n(0.7 - i * 0.04)}"`);
  }
  body += `<path d="M252 ${hz - 4}L252 ${hz - 40}L268 ${hz - 6}Z" fill="#F9F4EC"/><path d="M249 ${hz - 6}L246 ${hz - 32}L236 ${hz - 6}Z" fill="#F1EAE0"/><path d="M232 ${hz - 4}L272 ${hz - 4}L266 ${hz + 1}L238 ${hz + 1}Z" fill="#2D3A40"/>`;
  body += footer('Skärgård', '59°N 18°E', '#F7EFE4', { y: 664 });
  return doc(body, defs);
};

posters['dyner'] = () => {
  const defs = `${artClip()}<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4E4CE"/><stop offset="1" stop-color="#F0CFAE"/></linearGradient>`;
  const cols = ['#EAB98A', '#DB9B6D', '#C47C54', '#A15E3E', '#7A422C'];
  let art = rect(0, 0, W, H, 'url(#sky)') + circle(170, 220, 64, '#E8784C');
  cols.forEach((c, i) => {
    const y = 330 + i * 62;
    art += `<path d="${fillBelow(wave(y, [[26 - i * 2, 0.008 + i * 0.001, i * 1.7], [9, 0.021, i * 2.3]], 6))}" fill="${c}"/>`;
  });
  return doc(rect(0, 0, W, H, '#F2E9DD') + `<g clip-path="url(#art)">${art}</g>` + footer('Dyner', 'Ines Morell', '#7A422C'), defs);
};

posters['horisont'] = () => {
  const ink = '#2E4656';
  let body = rect(0, 0, W, H, '#EEEAE2');
  body += rect(36, 400, 428, 212, '#D9CFBF');
  body += `<path d="${pie(250, 400, 120, 180, 360)}" fill="${ink}"/>`;
  body += `<path d="M130 400A120 120 0 0 0 370 400" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
  body += rect(36, 399.5, 428, 1, ink);
  body += T('Horisont', { font: 'serifi', size: 30, x: 250, y: 560, fill: ink, anchor: 'middle' });
  return doc(body + footer('Horisont', 'Oskar Blom', ink));
};

posters['terrazzo'] = () => {
  const R = rng(88);
  const pal = ['#D98C6B', '#6B8F71', '#E6C07B', '#2F3B45', '#C3CAD0', '#A8574A', '#F2F0EA'];
  let chips = '';
  const placed = [];
  let tries = 0;
  while (placed.length < 170 && tries < 5000) {
    tries++;
    const x = R.range(ART.x - 10, ART.x + ART.w + 10), y = R.range(ART.y - 10, ART.y + ART.h + 10);
    const rr = R() < 0.12 ? R.range(16, 26) : R.range(4, 12);
    if (placed.some(([px, py, pr]) => Math.hypot(px - x, py - y) < pr + rr + 5)) continue;
    placed.push([x, y, rr]);
    const k = R.int(4, 7), rot = R.range(0, 6.28);
    const p = [...Array(k)].map((_, j) => {
      const a = rot + (j / k) * 6.28, q = rr * R.range(0.6, 1.1);
      return [x + q * Math.cos(a), y + q * Math.sin(a)];
    });
    chips += `<polygon points="${pts(p)}" fill="${R.pick(pal)}"/>`;
  }
  return doc(rect(0, 0, W, H, '#F0EBE3') + `<g clip-path="url(#art)">${rect(0, 0, W, H, '#E9E3D8')}${chips}</g>` + footer('Terrazzo', 'Noor Haddad', '#2F3B45'), artClip());
};

posters['tennisklubben-1974'] = () => {
  const green = '#2F5B4E', clay = '#C8653D', line = '#FBF6EC';
  let body = rect(0, 0, W, H, '#F1E6D3');
  const s = fitSize('TENNIS', 'xblack', 428, -0.02);
  body += T('TENNIS', { font: 'xblack', size: s, x: 36, y: 36 + capH('xblack', s), fill: green, ls: -0.02 });
  body += T('KLUBBEN · GRUNDAD 1974', { font: 'caption', size: 12, x: 36, y: 36 + capH('xblack', s) + 26, fill: green, ls: 0.28 });
  const yF = 300, yN = 612, wF = 170, wN = 428;
  const P = (u, v) => { // u: -1..1 över banan, v: 0 nära → 1 långt bort
    const y = yN - (yN - yF) * v;
    const w = wN + (wF - wN) * v;
    return [250 + (u * w) / 2, y];
  };
  const quad = (u0, u1, v0, v1) => pts([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]);
  body += `<polygon points="${quad(-1, 1, 0, 1)}" fill="${green}"/>`;
  body += `<polygon points="${quad(-0.84, 0.84, 0.06, 0.94)}" fill="${clay}"/>`;
  const L = (a, b) => `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="${line}" stroke-width="2.2"/>`;
  body += L(P(-0.84, 0.06), P(0.84, 0.06)) + L(P(-0.84, 0.94), P(0.84, 0.94)) + L(P(-0.84, 0.06), P(-0.84, 0.94)) + L(P(0.84, 0.06), P(0.84, 0.94));
  body += L(P(-0.63, 0.06), P(-0.63, 0.94)) + L(P(0.63, 0.06), P(0.63, 0.94));
  body += L(P(-0.63, 0.28), P(0.63, 0.28)) + L(P(-0.63, 0.72), P(0.63, 0.72)) + L(P(0, 0.28), P(0, 0.72));
  const [nx0, ny] = P(-0.92, 0.5), [nx1] = P(0.92, 0.5);
  body += rect(nx0, ny - 26, nx1 - nx0, 26, '#1D2A26', ' opacity=".35"') + rect(nx0, ny - 28, nx1 - nx0, 3, line) + rect(nx0 - 2, ny - 30, 3, 30, '#1D2A26') + rect(nx1 - 1, ny - 30, 3, 30, '#1D2A26');
  body += circle(376, 226, 24, '#D9E24C') + `<path d="M356 214Q376 226 360 244M396 208Q378 226 394 240" stroke="#FBF6EC" stroke-width="2.4" fill="none"/>`;
  body += `<path d="M300 236L338 230M296 250L336 244M304 264L340 256" stroke="${green}" stroke-width="2" stroke-linecap="round"/>`;
  return doc(body + footer('Tennisklubben', 'Oskar Blom', green));
};

posters['stjarnkarta'] = () => {
  const R = rng(5919);
  const bg = '#0F1729', gold = '#CDBB8B';
  const cx = 250, cy = 290, r = 196;
  let body = rect(0, 0, W, H, bg) + circle(cx, cy, r, '#121C33', ` stroke="${gold}" stroke-width="1.2"`);
  let grat = '';
  for (let k = 1; k < 3; k++) grat += `<circle cx="${cx}" cy="${cy}" r="${n((r * k) / 3)}" fill="none" stroke="${gold}" stroke-opacity=".25" stroke-dasharray="2 4"/>`;
  for (let a = 0; a < 180; a += 30) {
    const dx = r * Math.cos(rad(a)), dy = r * Math.sin(rad(a));
    grat += `<line x1="${n(cx - dx)}" y1="${n(cy - dy)}" x2="${n(cx + dx)}" y2="${n(cy + dy)}" stroke="${gold}" stroke-opacity=".18"/>`;
  }
  body += grat;
  const stars = [];
  for (let i = 0; i < 320; i++) {
    const a = R.range(0, 6.283), d = Math.sqrt(R()) * (r - 6);
    const size = 0.35 + R() ** 5 * 2.6;
    stars.push([cx + d * Math.cos(a), cy + d * Math.sin(a), size]);
  }
  const bright = stars.filter((s) => s[2] > 1.1);
  let lines = '';
  for (let g = 0; g < 6; g++) {
    let cur = R.pick(bright);
    const used = [cur];
    for (let s = 0; s < R.int(3, 5); s++) {
      const next = bright.filter((b) => !used.includes(b)).sort((p, q) => Math.hypot(p[0] - cur[0], p[1] - cur[1]) - Math.hypot(q[0] - cur[0], q[1] - cur[1]))[0];
      if (!next || Math.hypot(next[0] - cur[0], next[1] - cur[1]) > 70) break;
      lines += `M${n(cur[0])} ${n(cur[1])}L${n(next[0])} ${n(next[1])}`;
      used.push(next);
      cur = next;
    }
  }
  body += `<path d="${lines}" stroke="${gold}" stroke-opacity=".7" stroke-width=".8" fill="none"/>`;
  body += stars.map(([x, y, s]) => circle(x, y, s, '#F6F1E4', s < 0.8 ? ' opacity=".6"' : '')).join('');
  body += T('Stjärnhimlen', { font: 'serif', size: 40, x: 250, y: 560, fill: '#F3EBD8', anchor: 'middle' });
  body += T('ÖVER STOCKHOLM', { font: 'caption', size: 10.5, x: 250, y: 590, fill: gold, anchor: 'middle', ls: 0.34 });
  body += T('59°19′46″N  18°04′07″E', { font: 'mono', size: 9.5, x: 250, y: 612, fill: '#8A8FA0', anchor: 'middle' });
  return doc(body);
};

posters['memphis-86'] = () => {
  const R = rng(1986);
  const ink = '#1B1B1B';
  let body = rect(0, 0, W, H, '#F6E7E1');
  let dots = '';
  for (let x = 0; x < 6; x++) for (let y = 0; y < 5; y++) dots += circle(300 + x * 14, 90 + y * 14, 3, ink);
  body += dots;
  body += `<polygon points="${pts([[80, 250], [190, 190], [170, 310]])}" fill="#2BB3A3" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`;
  body += circle(360, 330, 64, '#F2635F', ` stroke="${ink}" stroke-width="4"`);
  body += `<path d="${pie(140, 500, 80, 180, 360)}" fill="#FFD95A" stroke="${ink}" stroke-width="4"/>`;
  const zig = (x, y, w, k, h) => `M${x} ${y}` + [...Array(k)].map((_, i) => `L${n(x + ((i + 1) * w) / k)} ${i % 2 ? y : y - h}`).join('');
  body += `<path d="${zig(70, 130, 170, 8, 26)}" stroke="${ink}" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
  body += `<path d="${zig(270, 520, 170, 7, 30)}" stroke="#6C5CE7" stroke-width="7" fill="none" stroke-linejoin="round"/>`;
  const sq = (x, y, w) => `M${x} ${y}` + [...Array(6)].map((_, i) => `Q${n(x + (i + 0.5) * w)} ${i % 2 ? y + 22 : y - 22} ${n(x + (i + 1) * w)} ${y}`).join('');
  body += `<path d="${sq(240, 420, 36)}" stroke="${ink}" stroke-width="4" fill="none"/>`;
  for (let i = 0; i < 18; i++) {
    const x = R.range(50, 450), y = R.range(60, 600);
    body += rect(x, y, 14, 5, R.pick(['#6C5CE7', '#2BB3A3', '#F2635F', ink]), ` transform="rotate(${n(R.range(0, 180))} ${n(x)} ${n(y)})"`);
  }
  body += rect(300, 200, 110, 20, '#6C5CE7', ` stroke="${ink}" stroke-width="4" transform="rotate(-18 355 210)"`);
  return doc(body + footer('Memphis 86', 'Studio Kvist', ink));
};

posters['fika'] = () => {
  const blocks = [['F', '#6B3E2E', '#F2E3D0'], ['I', '#E7B67C', '#6B3E2E'], ['K', '#C85C3C', '#F7E9D8'], ['A', '#2F2A26', '#E7B67C']];
  let body = rect(0, 0, W, H, '#F2E6D6');
  const bw = 214, bh = 236;
  blocks.forEach(([ch, bg, fg], i) => {
    const x = 36 + (i % 2) * bw, y = 36 + Math.floor(i / 2) * bh;
    body += rect(x, y, bw, bh, bg);
    const s = 210;
    body += T(ch, { font: 'xblack', size: s, x: x + bw / 2, y: y + bh / 2 + capH('xblack', s) / 2, fill: fg, anchor: 'middle' });
  });
  body += T('fika', { font: 'serifi', size: 34, x: 36, y: 552, fill: '#2F2A26' });
  body += T('(verb) att ta en paus med kaffe', { font: 'caption', size: 11.5, x: 110, y: 544, fill: '#2F2A26' });
  body += T('och något gott – helst tillsammans.', { font: 'caption', size: 11.5, x: 110, y: 560, fill: '#2F2A26' });
  return doc(body + footer('Fika', 'Maja Ekdahl', '#6B3E2E'));
};

posters['lagom'] = () => {
  const bg = '#1F2B26', fg = '#EDE5D2';
  let body = rect(0, 0, W, H, bg);
  const s = fitSize('LAGOM', 'cond', 428);
  body += T('LAGOM', { font: 'cond', size: s, x: 36, y: 330 + capH('cond', s) / 2, fill: fg });
  body += `<path d="M150 150L350 150M250 150L250 118M170 150L150 188L190 188ZM330 150L310 188L350 188Z" stroke="${fg}" stroke-width="2" fill="none" stroke-linejoin="round"/>`;
  body += circle(250, 114, 5, fg);
  body += T('la·gom (adv.)', { font: 'serifi', size: 24, x: 36, y: 540, fill: fg });
  body += T('Inte för mycket, inte för lite. Precis rätt.', { font: 'caption', size: 12, x: 36, y: 566, fill: '#A9B3A5' });
  return doc(body + footer('Lagom', 'Oskar Blom', '#A9B3A5'));
};

posters['bjorkskog'] = () => {
  const R = rng(4011);
  const defs = `${artClip()}<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5E3D8"/><stop offset="1" stop-color="#CFCBBB"/></linearGradient>
    <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FBFAF6"/><stop offset=".7" stop-color="#EDEBE3"/><stop offset="1" stop-color="#C9C6BB"/></linearGradient>`;
  let art = rect(0, 0, W, H, 'url(#fog)');
  const layers = [[9, 8, 14, 0.45], [7, 14, 24, 0.75], [4, 26, 40, 1]];
  layers.forEach(([count, wMin, wMax, op]) => {
    for (let i = 0; i < count; i++) {
      const w = R.range(wMin, wMax), x = R.range(10, W - 10 - w);
      art += `<g opacity="${op}">${rect(x, 0, w, H, 'url(#bark)')}`;
      for (let k = 0; k < 16; k++) {
        const y = R.range(20, 640), mw = w * R.range(0.3, 0.9), mx = R() < 0.5 ? x : x + w - mw;
        art += `<ellipse cx="${n(mx + mw / 2)}" cy="${n(y)}" rx="${n(mw / 2)}" ry="${n(R.range(1, 2.6))}" fill="#2B2A27"/>`;
      }
      art += '</g>';
    }
  });
  art += rect(0, 590, W, 40, '#B5AE97', ' opacity=".7"');
  return doc(rect(0, 0, W, H, '#EFEDE6') + `<g clip-path="url(#art)">${art}</g>` + footer('Björkskog', 'Theo Nakamura-Berg', '#2B2A27'), defs);
};

/* ------------------------------------------------------------------- run */

await loadFonts();
await fs.mkdir(OUT, { recursive: true });
let total = 0;
for (const [id, render] of Object.entries(posters)) {
  const svg = render();
  total += svg.length;
  await fs.writeFile(path.join(OUT, `${id}.svg`), svg);
}
console.log(`${Object.keys(posters).length} motiv skrivna till assets/posters (${Math.round(total / 1024)} kB)`);
