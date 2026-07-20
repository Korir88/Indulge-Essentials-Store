// js/components.js — reusable presentational components

import { CATEGORY_COLORS, EMOJIS, icons, state } from './state.js';
import { money } from './ui.js';

export function brandMark(){
  return `<svg viewBox="0 0 48 48" fill="none">
    <path d="M24 4C24 4 12 14 12 26a12 12 0 0 0 24 0C36 14 24 4 24 4Z" fill="var(--accent)" />
    <path d="M24 20v22" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round" />
  </svg>`;
}

export function stockPill(p){
  if(p.stock <= 0) return `<span class="stock-pill out">Out of stock</span>`;
  if(p.stock <= state.threshold) return `<span class="stock-pill low">${p.stock} left</span>`;
  return `<span class="stock-pill in">In stock</span>`;
}

// Console product card (POS) with add-to-cart
export function posCard(p){
  const color = CATEGORY_COLORS[p.category] || '#8FBE8A';
  const out = p.stock <= 0;
  return `<div class="product-card">
    <div class="product-band" style="background:${color}">${p.category}</div>
    <div class="product-art">${p.emoji ? `<span class="emoji">${p.emoji}</span>` : icons.leaf(color)}</div>
    <div class="product-body">
      <h4>${p.name}</h4>
      <div class="product-price mono">${money(p.price)}</div>
    </div>
    <button class="btn btn-primary" onclick="POS.addToCart(${p.id})" ${out ? 'disabled style="opacity:.5; cursor:not-allowed;"' : ''}>${out ? 'Out of Stock' : 'Add to Cart'}</button>
  </div>`;
}

// Client storefront card with add-to-cart button
export function clientCard(p){
  const color = CATEGORY_COLORS[p.category] || '#8FBE8A';
  const out = p.stock <= 0;
  return `<article class="product-card client-card">
    <div class="product-band" style="background:${color}">${p.category}</div>
    <div class="product-art">${p.emoji ? `<span class="emoji">${p.emoji}</span>` : icons.leaf(color)}</div>
    <div class="product-body">
      <h4>${p.name}</h4>
      <div class="product-price mono">${money(p.price)}</div>
    </div>
    <button class="btn btn-primary add-btn" onclick="Store.clientAdd(${p.id})" ${out ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>${out ? 'Out of Stock' : 'Add to Cart'}</button>
  </article>`;
}

export function kpiStrip(){
  const totalStock = state.products.reduce((s, p) => s + p.stock, 0);
  const lowCount = state.products.filter(p => p.stock <= state.threshold).length;
  const invValue = state.products.reduce((s, p) => s + p.price * p.stock, 0);
  const data = [
    { ic: icons.leaf('var(--accent)'), v: state.products.length, l: 'Products' },
    { ic: icons.box(), v: totalStock, l: 'Units in stock' },
    { ic: icons.star(), v: lowCount, l: 'Low stock' },
    { ic: icons.coin(), v: money(invValue), l: 'Inventory value' }
  ];
  return data.map(d => `
    <div class="kpi">
      <div class="kpi-ic">${d.ic}</div>
      <div><div class="kpi-v">${d.v}</div><div class="kpi-l">${d.l}</div></div>
    </div>`).join('');
}

export function emojiPicker(){
  return EMOJIS.map(e => `<button type="button" class="${e === state.selectedEmoji ? 'active' : ''}" onclick="Inventory.selectEmoji('${e}')">${e}</button>`).join('');
}
