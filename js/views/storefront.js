// js/views/storefront.js — public storefront (Shop Floor) + persistent client cart

import { CATEGORY_COLORS, TAX_RATE, icons, state } from '../state.js';
import { $, showToast, money } from '../ui.js';
import { clientCard } from '../components.js';
import { findProduct, uniqueCategories, saveState } from '../store.js';
import { openLogin } from '../auth.js';

export const Store = { // 'shop' | 'cart'

  mount(root){
    root.insertAdjacentHTML('beforeend', `
      <div id="publicView" class="public-view client-layout">
        <header class="client-header">
          <div class="client-brand" onclick="Store.selectCategory('All')">
            ${icons.leaf('var(--accent)')}
            <span>Indulge Essentials</span>
          </div>
          <nav class="client-nav" id="clientNav"></nav>
          <div class="client-header-actions">
            <button class="icon-btn" id="themeBtnPublic" onclick="App.toggleTheme()" aria-label="Toggle theme"></button>
            <button class="btn btn-ghost btn-sm" onclick="Auth.openLogin()">
              ${icons.user()} <span>Staff</span>
            </button>
            <button class="cart-pill" id="cartPill" onclick="Store.scrollToCart()">
              ${icons.cart()}<span class="cart-pill-count" id="cartPillCount">0</span>
            </button>
          </div>
        </header>
        
        <aside class="cat-sidebar">
          <div class="cat-sidebar-head">CATEGORIES</div>
          <nav class="cat-sidebar-nav" id="catSidebar"></nav>
        </aside>
        
        <main class="client-products" id="clientProducts"></main>
        
        <aside class="cart-panel" id="cartPanel">
          <h3>Your Cart</h3>
          <div id="cartPanelBody"></div>
        </aside>
      </div>`);
    this.renderClientNav();
    this.renderCategories();
    this.renderProducts();
    this.renderCartPanel();
  },

  // ----- navigation -----
  renderClientNav(){
    const cats = ['All', ...uniqueCategories()];
    $('#clientNav').innerHTML = cats.map(c => {
      const active = (state.selectedCategory === c) ? 'active' : '';
      const color = c === 'All' ? 'var(--accent)' : (CATEGORY_COLORS[c] || 'var(--accent)');
      return `<button class="client-nav-item ${active}" onclick="Store.selectCategory('${c.replace(/'/g,"\\'")}')">
        <span class="dot" style="background:${color}"></span>${c}</button>`;
    }).join('');
  },
  renderCategories(){
    const cats = ['All', ...uniqueCategories()];
    $('#catSidebar').innerHTML = cats.map(c => {
      const active = (state.selectedCategory === c) ? 'active' : '';
      const color = c === 'All' ? 'var(--accent)' : (CATEGORY_COLORS[c] || 'var(--accent)');
      return `<button class="cat-sidebar-item ${active}" onclick="Store.selectCategory('${c.replace(/'/g,"\\'")}')">
        <span class="dot" style="background:${color}"></span>${c}</button>`;
    }).join('');
  },
  selectCategory(c){
    state.selectedCategory = c;
    this.renderClientNav();
    this.renderCategories();
    this.renderProducts();
    window.scrollTo({ top:0, behavior:'smooth' });
  },
  
  scrollToCart(){
    document.getElementById('cartPanel')?.scrollIntoView({ behavior:'smooth', block:'start' });
  },

  // ----- products -----
  renderProducts(){
    const cats = uniqueCategories();
    const groups = state.selectedCategory === 'All' ? cats : [state.selectedCategory];
    
    let html = '';
    groups.forEach(c => {
      const color = CATEGORY_COLORS[c] || 'var(--accent)';
      const items = state.products.filter(p => p.category === c);
      if(items.length === 0) return;
      
      html += `<div class="cat-group">
        <div class="cat-group-head"><span class="cat-group-dot" style="background:${color}"></span>${c}</div>
        <div class="client-products-grid">${items.map(clientCard).join('')}</div>
      </div>`;
    });
    
    $('#clientProducts').innerHTML = html || '<div class="empty-note">No products found.</div>';
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
    this.renderClientNav();
    this.renderCategories();
    this.renderProducts();
    this.renderCartPanel();
  },

  // Cart panel (right sidebar)
  renderCartPanel(){
    const ids = Object.keys(state.clientCart);
    const sub = this.clientSubtotal();
    const currentDiscount = $('#clientDiscount')?.value || '0';
    const disc = this.cartDiscount();
    const tax = this.cartTax();
    const total = this.cartTotal();

    let body;
    if(ids.length === 0){
      body = `<div class="cart-panel-empty">Your cart is empty</div>`;
    } else {
      body = ids.map(id => {
        const p = findProduct(id);
        const qty = state.clientCart[id];
        return `<div class="cart-panel-line">
          <div class="cart-panel-line-name">${p.name} <span class="cart-panel-line-qty">x${qty}</span></div>
          <div class="cart-panel-line-price mono">${money(p.price * qty)}</div>
        </div>`;
      }).join('');
    }

    const summary = `
      <div class="cart-subline"><span>Subtotal</span><span class="mono">${money(sub)}</span></div>
      <div class="discount-row">
        <input id="clientDiscount" type="number" min="0" max="100" value="${currentDiscount}" oninput="Store.renderCartPanel()" placeholder="0" />
        <span class="discount-pct">% off</span>
      </div>
      <div class="payment-row">
        <select id="paymentMethod" onchange="Store.renderCartPanel()">
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Mobile">Mobile</option>
        </select>
      </div>
      <div class="cart-subline"><span>Tax (8%)</span><span class="mono">${money(tax)}</span></div>
      <div class="cart-total"><span>Total</span><span class="mono">${money(total)}</span></div>
      <button class="btn btn-primary" style="width:100%; margin-top:14px;" onclick="Store.checkout()" ${ids.length === 0 ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>Proceed to Payment</button>
    `;

    $('#cartPanelBody').innerHTML = body + summary;
  },

  checkout(){
    const ids = Object.keys(state.clientCart);
    if(ids.length === 0){ showToast('Your basket is empty'); return; }
    const total = this.cartTotal();
    showToast(`Order placed — ${money(total)}. Thank you!`);
    state.clientCart = {};
    this._persist();
    this.render();
  }
};