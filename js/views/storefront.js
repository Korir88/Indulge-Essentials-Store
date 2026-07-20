// js/views/storefront.js — public storefront (Shop Floor) + persistent client cart

import { CATEGORY_COLORS, TAX_RATE, icons, state } from '../state.js';
import { $, $$, showToast, money } from '../ui.js';
import { storeCard, brandMark } from '../components.js';
import { findProduct, uniqueCategories, saveState } from '../store.js';
import { openLogin } from '../auth.js';

export const Store = {
  view: 'shop', // 'shop' | 'cart'

  mount(root){
    root.insertAdjacentHTML('beforeend', `
      <div id="publicView" class="public-view">
        <header class="top public-header">
          <div class="brand" onclick="Store.goShop()">
            ${brandMark()} <span>Indulge Essentials</span>
          </div>
          <nav class="shop-nav" id="shopNav"></nav>
          <div class="head-right">
            <button class="icon-btn" id="themeBtnPublic" onclick="App.toggleTheme()" aria-label="Toggle theme"></button>
            <button class="btn btn-ghost btn-sm" onclick="Auth.openLogin()">
              ${icons.user()} Staff
            </button>
            <button class="cart-pill" id="cartPill" onclick="Store.goCart()">
              ${icons.cart()}<span class="cart-pill-count" id="cartPillCount">0</span>
            </button>
          </div>
        </header>

        <main class="content store-main" id="shopView"></main>

        <section class="cart-page hidden" id="cartView"></section>

        <footer class="store-foot">
          <div class="brand">${brandMark()} <span>Indulge Essentials</span></div>
          <p>&copy; 2026 Indulge Essentials. Staff? <a href="#" onclick="Auth.openLogin()">Sign in to the console</a>.</p>
        </footer>
      </div>`);
    this.renderNav();
    this.renderShop();
    this.renderCart();
  },

  // ----- navigation -----
  renderNav(){
    const cats = ['All', ...uniqueCategories()];
    $('#shopNav').innerHTML = cats.map(c => {
      const active = (state.selectedCategory === c) ? 'active' : '';
      const color = c === 'All' ? 'var(--accent)' : (CATEGORY_COLORS[c] || 'var(--accent)');
      return `<button class="shop-nav-item ${active}" onclick="Store.selectCategory('${c.replace(/'/g,"\\'")}')">
        <span class="dot" style="background:${color}"></span>${c}</button>`;
    }).join('');
  },
  selectCategory(c){
    state.selectedCategory = c;
    this.renderNav(); this.renderShop();
    window.scrollTo({ top:0, behavior:'smooth' });
  },
  goShop(){
    this.view = 'shop';
    $('#shopView').classList.remove('hidden');
    $('#cartView').classList.add('hidden');
    $('#shopNav').style.display = '';
    this.renderNav();
    window.scrollTo({ top:0, behavior:'smooth' });
  },
  goCart(){
    this.view = 'cart';
    $('#shopView').classList.add('hidden');
    $('#cartView').classList.remove('hidden');
    $('#shopNav').style.display = 'none';
    this.renderCartView();
    window.scrollTo({ top:0, behavior:'smooth' });
  },

  // ----- shop floor -----
  renderShop(){
    const q = state.search.trim().toLowerCase();
    const searching = q.length > 0;
    const cats = uniqueCategories();

    let hero = '';
    if(!searching){
      hero = `<section class="shop-hero">
        <div class="shop-hero-inner">
          <span class="shop-hero-kicker">Calm goods for everyday life</span>
          <h1 class="shop-hero-title">The Indulge Shop Floor</h1>
          <p class="shop-hero-sub">Thoughtfully made essentials — from organic cotton tees to hand-poured candles. Browse by category and build your basket at your own pace.</p>
          <button class="btn btn-primary" onclick="Store.goCart()">View your basket ${icons.cart()}</button>
        </div>
      </section>`;
    }

    const searchBar = `<div class="search-bar inline wide">
      ${icons.search()}
      <input id="publicSearch" type="text" placeholder="Search the whole store..." value="${state.search.replace(/"/g,'"')}" oninput="Store.onSearch()" />
    </div>`;

    let body;
    if(searching){
      const matches = state.products.filter(p => p.name.toLowerCase().includes(q));
      body = `<div class="cat-group">
        <div class="cat-group-head"><span class="cat-group-dot" style="background:var(--accent)"></span>Results for &ldquo;${q}&rdquo;</div>
        <div class="product-grid shop-grid">${matches.length ? matches.map(storeCard).join('') : `<div class="empty-note">No products found for &ldquo;${q}&rdquo;.</div>`}</div>
      </div>`;
    } else {
      const groups = state.selectedCategory === 'All'
        ? cats
        : [state.selectedCategory];
      body = groups.map(c => {
        const color = CATEGORY_COLORS[c] || 'var(--accent)';
        const items = state.products.filter(p => p.category === c);
        return `<div class="cat-group">
          <div class="cat-group-head"><span class="cat-group-dot" style="background:${color}"></span>${c}<span class="cat-group-count">${items.length}</span></div>
          <div class="product-grid shop-grid">${items.map(storeCard).join('')}</div>
        </div>`;
      }).join('');
    }

    $('#shopView').innerHTML = hero + searchBar + body;
    this.renderCart();
  },

  onSearch(){
    state.search = $('#publicSearch').value;
    this.renderShop();
  },

  // ----- cart mutations (persisted) -----
  _persist(){ saveState(); },
  clientAdd(id){
    const p = findProduct(id);
    if(!p || p.stock <= 0){ showToast('Out of stock'); return; }
    const inCart = state.clientCart[id] || 0;
    if(inCart >= p.stock){ showToast('No more stock available'); return; }
    state.clientCart[id] = inCart + 1;
    this._persist(); this.render(); showToast(`Added ${p.name}`);
  },
  clientChangeQty(id, delta){
    const p = findProduct(id);
    if(!p) return;
    let q = (state.clientCart[id] || 0) + delta;
    if(q <= 0){ delete state.clientCart[id]; }
    else if(q > p.stock){ showToast('No more stock available'); return; }
    else state.clientCart[id] = q;
    this._persist(); this.render();
  },
  clientRemove(id){
    delete state.clientCart[id];
    this._persist(); this.render();
  },
  clientSetQty(id, qty){
    const p = findProduct(id);
    if(!p) return;
    qty = parseInt(qty, 10);
    if(isNaN(qty) || qty <= 0){ delete state.clientCart[id]; }
    else if(qty > p.stock){ showToast('No more stock available'); state.clientCart[id] = p.stock; }
    else state.clientCart[id] = qty;
    this._persist(); this.render();
  },
  clearCart(){
    state.clientCart = {};
    this._persist(); this.render();
  },

  // ----- cart math -----
  clientSubtotal(){
    return Object.keys(state.clientCart).reduce((s, id) => {
      const p = findProduct(id);
      return s + (p ? p.price * state.clientCart[id] : 0);
    }, 0);
  },
  cartCount(){
    return Object.keys(state.clientCart).reduce((s, id) => s + state.clientCart[id], 0);
  },
  cartDiscount(){
    const sub = this.clientSubtotal();
    const pct = Math.min(100, Math.max(0, parseFloat($('#clientDiscount')?.value) || 0));
    return sub * (pct / 100);
  },
  cartTax(){
    return (this.clientSubtotal() - this.cartDiscount()) * TAX_RATE;
  },
  cartTotal(){
    return this.clientSubtotal() - this.cartDiscount() + this.cartTax();
  },

  // ----- rendering -----
  render(){
    // re-render whichever surface is visible
    this.renderShop();
    if(this.view === 'cart') this.renderCartView();
    else this.renderCart();
  },
  renderCart(){
    const count = this.cartCount();
    const pill = $('#cartPillCount');
    if(pill){ pill.textContent = count; pill.classList.toggle('has', count > 0); }
  },

  // Full cart view (subtotal, discount, tax, checkout)
  renderCartView(){
    const ids = Object.keys(state.clientCart);
    const sub = this.clientSubtotal();
    const disc = this.cartDiscount();
    const tax = this.cartTax();
    const total = this.cartTotal();

    const lines = ids.length === 0
      ? `<div class="cart-empty-big">
           <div class="cart-empty-emoji">🛒</div>
           <h3>Your basket is empty</h3>
           <p>Looks like you haven't added anything yet. Let's fix that.</p>
           <button class="btn btn-primary" onclick="Store.goShop()">Browse the Shop Floor</button>
         </div>`
      : ids.map(id => {
          const p = findProduct(id);
          const qty = state.clientCart[id];
          const max = Math.max(qty, p.stock);
          const out = p.stock <= 0;
          return `<div class="cart-line-full">
            <div class="cart-line-art" style="background:${CATEGORY_COLORS[p.category] || 'var(--accent)'}22">${p.emoji || '🌿'}</div>
            <div class="cart-line-info">
              <div class="cart-line-name">${p.name}</div>
              <div class="cart-line-cat">${p.category} &middot; ${money(p.price)} each</div>
              <div class="cart-line-removed">
                <button class="link-btn" onclick="Store.clientRemove(${p.id})">Remove</button>
              </div>
            </div>
            <div class="qty-ctrl big">
              <button onclick="Store.clientChangeQty(${p.id},-1)" aria-label="Decrease">−</button>
              <input class="qty-input mono" type="number" min="1" max="${max}" value="${qty}" onchange="Store.clientSetQty(${p.id}, this.value)" ${out ? 'disabled' : ''} />
              <button onclick="Store.clientChangeQty(${p.id},1)" aria-label="Increase" ${out ? 'disabled style="opacity:.4;cursor:not-allowed;"' : ''}>+</button>
            </div>
            <div class="cart-line-price mono">${money(p.price * qty)}</div>
          </div>`;
        }).join('');

    const summary = ids.length === 0 ? '' : `
      <div class="cart-summary">
        <div class="field" style="margin-bottom:14px;">
          <label for="clientDiscount">Discount code / % off</label>
          <div class="discount-row">
            <input id="clientDiscount" type="number" min="0" max="100" value="0" oninput="Store.renderCartView()" placeholder="0" />
            <span class="discount-pct">% off</span>
          </div>
        </div>
        <div class="cart-subline"><span>Subtotal</span><span class="mono">${money(sub)}</span></div>
        ${disc > 0 ? `<div class="cart-subline discount"><span>Discount</span><span class="mono">−${money(disc)}</span></div>` : ''}
        <div class="cart-subline"><span>Tax (${(TAX_RATE*100).toFixed(0)}%)</span><span class="mono">${money(tax)}</span></div>
        <div class="cart-total"><span>Total</span><span class="mono">${money(total)}</span></div>
        <button class="btn btn-primary" style="width:100%; margin-top:14px;" onclick="Store.checkout()">Checkout &middot; ${money(total)}</button>
        <button class="btn btn-ghost" style="width:100%; margin-top:8px;" onclick="Store.clearCart()">Clear basket</button>
      </div>`;

    $('#cartView').innerHTML = `
      <div class="cart-view-head">
        <button class="link-btn back" onclick="Store.goShop()">&larr; Back to Shop Floor</button>
        <h1 class="cart-view-title">Your Basket</h1>
        <div class="cart-view-count">${this.cartCount()} item${this.cartCount()!==1?'s':''}</div>
      </div>
      <div class="cart-view-grid">
        <div class="cart-lines">${lines}</div>
        <aside class="cart-aside">${summary}</aside>
      </div>`;
  },

  checkout(){
    const ids = Object.keys(state.clientCart);
    if(ids.length === 0){ showToast('Your basket is empty'); return; }
    const total = this.cartTotal();
    showToast(`Order placed — ${money(total)}. Thank you!`);
    state.clientCart = {};
    this._persist();
    this.goShop();
  }
};