// js/ui.js — small DOM & formatting helpers shared across modules

import { icons, CATEGORY_COLORS } from './state.js';

export const money = (n) => '$' + Number(n).toFixed(2);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Build an element from an HTML string and return it.
export function html(strings, ...values){
  const tpl = document.createElement('template');
  tpl.innerHTML = String.raw({ raw: strings }, ...values);
  return tpl.content.firstElementChild;
}

export function escapeAttr(str){
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Re-render by id helper
export function setHTML(id, markup){
  const node = document.getElementById(id);
  if(node) node.innerHTML = markup;
}
export function setText(id, text){
  const node = document.getElementById(id);
  if(node) node.textContent = text;
}

let toastTimer;
export function showToast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// Charts (pure SVG string generators)
export function lineChart(monthly){
  const w = 560, h = 220, padL = 44, padB = 26, padT = 14, padR = 14;
  const maxV = Math.max(...monthly.map(m => m.v)) * 1.1;
  const stepX = (w - padL - padR) / (monthly.length - 1);
  const pts = monthly.map((m, i) => [padL + i * stepX, padT + (h - padT - padB) * (1 - m.v / maxV)]);
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ` L${pts[pts.length-1][0].toFixed(1)} ${h-padB} L${pts[0][0].toFixed(1)} ${h-padB} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y = padT + (h - padT - padB) * f;
    const val = Math.round(maxV * (1 - f));
    return `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" stroke="var(--border)" stroke-width="1"/>
      <text x="${padL-8}" y="${y+4}" font-size="10" fill="var(--text-faint)" text-anchor="end" font-family="IBM Plex Mono, monospace">${val}</text>`;
  }).join('');
  const labels = monthly.map((m, i) => `<text x="${pts[i][0]}" y="${h-8}" font-size="11" fill="var(--text-dim)" text-anchor="middle" font-family="Inter, sans-serif">${m.m}</text>`).join('');
  const dots = pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto;">
    <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}
    <path d="${areaPath}" fill="url(#areaGrad)"/>
    <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots} ${labels}
  </svg>`;
}

export function donutChart(products){
  const values = {};
  products.forEach(p => { values[p.category] = (values[p.category] || 0) + p.price * p.stock; });
  const total = Object.values(values).reduce((a, b) => a + b, 0) || 1;
  const r = 62, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  let offset = 0;
  const entries = Object.entries(values);
  const circles = entries.map(([cat, val]) => {
    const frac = val / total;
    const len = frac * circ;
    const dash = `${len.toFixed(2)} ${(circ - len).toFixed(2)}`;
    const rot = (offset / circ) * 360;
    offset += len;
    const color = CATEGORY_COLORS[cat] || '#8FBE8A';
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="24" stroke-dasharray="${dash}" transform="rotate(${rot-90} ${cx} ${cy})"/>`;
  }).join('');
  const svg = `<svg width="160" height="160" viewBox="0 0 160 160">${circles}<circle cx="${cx}" cy="${cy}" r="${r-14}" fill="var(--surface)"/></svg>`;
  const legend = entries.map(([cat, val]) => {
    const pct = Math.round((val / total) * 100);
    const color = CATEGORY_COLORS[cat] || '#8FBE8A';
    return `<div class="legend-item"><span class="dot" style="background:${color}"></span>${cat}<span class="legend-pct">${pct}%</span></div>`;
  }).join('');
  return { svg, legend };
}

export { icons };
